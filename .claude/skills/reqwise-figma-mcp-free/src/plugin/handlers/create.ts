/// <reference types="@figma/plugin-typings" />
import { HandlerContext } from "../context.js";
import { resolveParent, insertInto } from "../insert.js";
import { toPaints, toEffects } from "../paints.js";
import { loadFontWithFallback, DEFAULT_FONT } from "../fonts.js";
import { serializeNode } from "../serialize.js";
import { applyTextAlign } from "./text.js";
import {
  resolveTextStyle,
  applyTextStyleToNode,
  parseLineHeight,
  parseLetterSpacing,
} from "./styles.js";
import {
  findVariableByName,
  bindVariableToField,
  expandBindableField,
} from "./tokens.js";
import { err } from "../errors.js";
import { ErrorCode } from "../../shared/protocol.js";
import {
  resolveGeometry,
  needsParent,
  overflowsParent,
  defaultLineHeight,
  Box,
  Inset,
  GeometryRequest,
  InsertAt,
  normalizePadding,
  resolveUniformCornerRadius,
  usesTransparentContainerDefault,
  boxesOverlap,
} from "../layout-math.js";
import { isHexColor } from "../color-util.js";

type NodeType =
  | "FRAME"
  | "TEXT"
  | "RECTANGLE"
  | "ELLIPSE"
  | "LINE"
  | "COMPONENT"
  | "INSTANCE";

/**
 * Spec-based node creation. Supports inset/align geometry, insertAt z-order,
 * TEXT wrap, auto counterAxisSizingMode for child auto-layout under a fixed
 * parent, clip-bounds / opacity warnings, and a nested `children` array that
 * builds a whole subtree in one call.
 */
export async function create(ctx: HandlerContext): Promise<unknown> {
  const node = await buildNode(ctx, ctx.params);

  // Nested children: build the subtree declaratively in one call. Each child
  // is created through the SAME pipeline (token binding, text style, layout),
  // parented to the node we just made. Without this the `children` array was
  // silently dropped, so `create({ children:[...] })` and createVariants base
  // specs came out empty. Children are created in array order (index 0 first),
  // so z-order matches declaration order.
  const kids = ctx.params.children;
  if (Array.isArray(kids)) {
    for (const raw of kids) {
      if (raw && typeof raw === "object") {
        await create(childCtx(ctx, raw as Record<string, unknown>, node.id));
      }
    }
  }

  const out: Record<string, unknown> = {
    id: node.id,
    node: serializeNode(node, "compact"),
  };
  const fr = (ctx as unknown as { fontResolution?: unknown }).fontResolution;
  if (fr) out.font = fr;
  return out;
}

/**
 * Derive a child HandlerContext: a fresh params object with `parentId` forced
 * to the parent we just created, sharing the parent's warning sink and progress
 * callback so nested warnings still surface. `parentId`/`children` from the
 * child spec are handled by the recursion itself, not inherited from the outer
 * spec.
 */
function childCtx(
  parent: HandlerContext,
  childSpec: Record<string, unknown>,
  parentId: string,
): HandlerContext {
  return {
    params: { ...childSpec, parentId },
    warnings: parent.warnings,
    progress: parent.progress,
    warn: parent.warn,
  };
}

/**
 * Create a single node from a spec (no `children` handling — that lives in
 * `create`). Returns the live node so the caller can parent children into it.
 */
async function buildNode(
  ctx: HandlerContext,
  p: Record<string, unknown>,
): Promise<SceneNode> {
  const type = String(p.type ?? "FRAME").toUpperCase() as NodeType;
  const parent = await resolveParent(p.parentId);
  const parentBox = parentSize(parent);

  const geoReq: GeometryRequest = {
    x: numOr(p.x),
    y: numOr(p.y),
    w: numOr(p.w ?? p.width),
    h: numOr(p.h ?? p.height),
    inset: p.inset as Inset | undefined,
    align: p.align as GeometryRequest["align"],
  };
  if (needsParent(geoReq) && !parentBox) {
    ctx.warn(
      "inset/align requested but parent has no measurable size; used raw coordinates.",
    );
  }

  // Resolve token bindings and text style BEFORE creating the node so a bad
  // token/style name fails fast instead of leaving an orphan half-styled node.
  const tokenBindings = await resolveTokenBindings(p);
  const textStyle =
    type === "TEXT" && typeof p.textStyle === "string"
      ? await resolveTextStyle(p.textStyle)
      : null;

  const node = await createNode(type, p);
  if (typeof p.name === "string") node.name = p.name;

  // Figma creates FRAME/COMPONENT nodes with a white fill. Most frames an
  // agent creates are structural auto-layout wrappers, so that default turns
  // innocent wrappers into large white slabs that cover their background and
  // hide light text. Omitted fill now means transparent; visible surfaces must
  // opt in with `fill`/`fills` (or bind a token immediately afterwards).
  if (usesTransparentContainerDefault(type, p) && "fills" in node) {
    (node as GeometryMixin).fills = [];
  }

  // Insert into parent first so parent-relative sizing/layout applies.
  insertInto(parent, node, p.insertAt as InsertAt | undefined);

  if (type === "TEXT") {
    await applyText(node as TextNode, ctx, parent);
    if (textStyle) {
      if (typeof p.fontSize === "number" || typeof p.fontFamily === "string") {
        ctx.warn(
          `textStyle "${textStyle.name}" overrides the fontSize/fontFamily also passed in this spec.`,
        );
      }
      await applyTextStyleToNode(node as TextNode, textStyle);
    }
  }

  applyGeometry(node, geoReq, parentBox, parent, type);
  applyVisuals(node, p, ctx, type);

  if ((type === "FRAME" || type === "COMPONENT") && p.layoutMode) {
    applyAutoLayout(node as FrameNode, p, parent, ctx);
  }

  // layoutAlign/layoutGrow govern how THIS node behaves as a child of an
  // auto-layout parent (e.g. STRETCH → fill the cross axis / full-width).
  // They apply to any node type, so they live outside applyAutoLayout (which
  // only runs for frames that are themselves auto-layouts). Without this,
  // `create({ layoutAlign: "STRETCH" })` was silently dropped while
  // `modify(id, { layoutAlign: "STRETCH" })` worked — the root cause of
  // buttons/inputs rendering hug-width instead of full-width.
  applyChildLayout(node, p);

  // Token bindings go last so they land on final paints/layout (autoLayout
  // must exist before paddings/itemSpacing can bind).
  for (const b of tokenBindings) {
    bindVariableToField(node, b.field, b.variable);
  }

  warnIfClipped(node, parent, ctx);
  warnIfLooksInvisible(node, p, parent, ctx);
  warnIfDroppedOnSibling(node, p, parent, ctx);
  warnIfWrapperFillMatchesParent(node, parent, ctx);

  // TEXT with no color source renders in Figma's native pure black (#000000),
  // the classic "unfinished wireframe" look. A textStyle usually carries a
  // color, and an explicit fill / $token fill is a color; anything else means
  // the caller forgot. Warn (don't force a value — we don't know the palette).
  if (type === "TEXT" && !textStyle) {
    const hasFillLiteral =
      p.fills !== undefined ||
      (typeof p.fill === "string" && (p.fill as string).length > 0);
    const hasFillToken = tokenBindings.some((b) => b.field === "fills");
    if (!hasFillLiteral && !hasFillToken) {
      ctx.warn(
        "TEXT created without a color — it will render pure black (#000000), which looks like an unfinished wireframe. Set fill:\"$color/ink\" (or a hex), or apply a textStyle that carries a color. See figma_docs(section=\"style\").",
      );
    }
  }

  return node;
}

async function createNode(
  type: NodeType,
  p: Record<string, unknown>,
): Promise<SceneNode> {
  switch (type) {
    case "FRAME":
      return figma.createFrame();
    case "TEXT":
      return figma.createText();
    case "RECTANGLE":
      return figma.createRectangle();
    case "ELLIPSE":
      return figma.createEllipse();
    case "LINE":
      return figma.createLine();
    case "COMPONENT":
      return figma.createComponent();
    case "INSTANCE": {
      const compId = String(p.componentId ?? "");
      const comp = await figma.getNodeByIdAsync(compId);
      if (!comp || comp.type !== "COMPONENT") {
        throw err(
          ErrorCode.NODE_NOT_FOUND,
          `componentId "${compId}" is not a COMPONENT.`,
          "Use find_component / find_or_create_component to obtain a component id first.",
        );
      }
      return (comp as ComponentNode).createInstance();
    }
    default:
      throw err(
        ErrorCode.INVALID_PARAMS,
        `Unsupported create type "${String(type)}".`,
        "Use FRAME/TEXT/RECTANGLE/ELLIPSE/LINE/COMPONENT/INSTANCE.",
      );
  }
}

export function parentSize(parent: BaseNode): { w: number; h: number } | null {
  if ("width" in parent && "height" in parent) {
    return {
      w: (parent as LayoutMixin).width,
      h: (parent as LayoutMixin).height,
    };
  }
  return null;
}

function numOr(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

async function applyText(
  node: TextNode,
  ctx: HandlerContext,
  parent: BaseNode,
): Promise<void> {
  const p = ctx.params;
  // Accept both the flat fontFamily/fontStyle spelling and the Figma-native
  // fontName:{family,style} object. Previously only the flat form was read, so
  // create({ fontName:{family:"X"} }) was silently ignored — the font fell back
  // to Inter AND requestedFont reported Inter instead of the family asked for.
  const fontName = (p.fontName ?? {}) as { family?: unknown; style?: unknown };
  const family =
    typeof p.fontFamily === "string"
      ? p.fontFamily
      : typeof fontName.family === "string"
        ? fontName.family
        : DEFAULT_FONT.family;
  const style =
    typeof p.fontStyle === "string"
      ? p.fontStyle
      : typeof fontName.style === "string"
        ? fontName.style
        : DEFAULT_FONT.style;
  const res = await loadFontWithFallback({ family, style });
  node.fontName = res.resolvedFont;
  if (res.substituted && res.reason) ctx.warn(res.reason);

  // Font size: honor an explicit value; otherwise default to 16 (a real UI body
  // size) instead of Figma's native 12px, which reads as a cramped wireframe.
  // A textStyle, applied after this in create(), still overrides freely.
  const sizeGiven = typeof p.fontSize === "number";
  if (sizeGiven) node.fontSize = p.fontSize as number;
  else if (typeof p.textStyle !== "string") node.fontSize = 16;

  if (typeof p.characters === "string") node.characters = p.characters;
  else if (typeof p.text === "string") node.characters = p.text;

  // Content alignment inside the text box (textAlignHorizontal/Vertical). This
  // is what "center the text" means; `align` positions the whole node instead.
  applyTextAlign(node, p);

  // letterSpacing was previously never read on create — a raw value passed here
  // was silently dropped. Honor it (still overridden by a textStyle applied
  // after this in create()).
  if (p.letterSpacing !== undefined) {
    node.letterSpacing = parseLetterSpacing(p.letterSpacing);
  }

  // Line height: honor an explicit value (previously also dropped on create);
  // otherwise derive it from the size for ALL text, not only wrapped. Skip when
  // a textStyle drives typography.
  if (p.lineHeight !== undefined) {
    node.lineHeight = parseLineHeight(p.lineHeight);
  } else if (typeof p.textStyle !== "string") {
    const size = typeof node.fontSize === "number" ? node.fontSize : 16;
    node.lineHeight = { value: defaultLineHeight(size), unit: "PIXELS" };
  }

  if (p.wrap === true) {
    node.textAutoResize = "HEIGHT";
    node.layoutAlign = "STRETCH";
    if (!parentHasFixedWidth(parent)) {
      ctx.warn(
        "wrap:true set but parent has no fixed width; wrapped text may not constrain. Set the parent to a fixed width.",
      );
    }
  }

  (ctx as unknown as { fontResolution?: unknown }).fontResolution = {
    requestedFont: res.requestedFont,
    resolvedFont: res.resolvedFont,
    reason: res.reason,
  };
}

function parentHasFixedWidth(parent: BaseNode): boolean {
  if (!("width" in parent)) return false;
  if (!("layoutMode" in parent)) return true;
  const f = parent as FrameNode;
  return f.layoutMode === "NONE" || f.counterAxisSizingMode === "FIXED";
}

function applyGeometry(
  node: SceneNode,
  geoReq: GeometryRequest,
  parentBox: { w: number; h: number } | null,
  parent: BaseNode,
  type: NodeType,
): void {
  if (!("x" in node)) return;
  const layout = node as LayoutMixin;
  const box: Box = parentBox
    ? resolveGeometry(geoReq, parentBox)
    : {
        x: geoReq.x ?? 0,
        y: geoReq.y ?? 0,
        w: geoReq.w ?? layout.width,
        h: geoReq.h ?? layout.height,
      };

  const wantW = geoReq.w !== undefined || hasHInset(geoReq.inset);
  const wantH = geoReq.h !== undefined || hasVInset(geoReq.inset);
  const canResize = "resize" in node && type !== "LINE";
  if (canResize && (wantW || wantH)) {
    const w = Math.max(0.01, wantW ? box.w : layout.width);
    let h = Math.max(0.01, wantH ? box.h : layout.height);
    if (type === "TEXT" && (node as TextNode).textAutoResize === "HEIGHT") {
      h = (node as TextNode).height;
    }
    (node as unknown as { resize(w: number, h: number): void }).resize(w, h);
  }

  const managed =
    "layoutMode" in parent && (parent as FrameNode).layoutMode !== "NONE";
  if (!managed) {
    layout.x = box.x;
    layout.y = box.y;
  }
}

function hasHInset(inset?: Inset): boolean {
  return (
    !!inset && (typeof inset.left === "number" || typeof inset.right === "number")
  );
}
function hasVInset(inset?: Inset): boolean {
  return (
    !!inset && (typeof inset.top === "number" || typeof inset.bottom === "number")
  );
}

function applyVisuals(
  node: SceneNode,
  p: Record<string, unknown>,
  ctx: HandlerContext,
  type: NodeType,
): void {
  if (p.fills !== undefined && "fills" in node) {
    (node as GeometryMixin).fills = toPaints(p.fills);
    warnTokenLiteral(p.fills, ctx);
  } else if (
    typeof p.fill === "string" &&
    isHexColor(p.fill) &&
    "fills" in node
  ) {
    (node as GeometryMixin).fills = toPaints(p.fill);
  }
  if (p.strokes !== undefined && "strokes" in node) {
    (node as GeometryMixin).strokes = toPaints(p.strokes);
  }
  if (typeof p.strokeWeight === "number" && "strokeWeight" in node) {
    (node as MinimalStrokesMixin).strokeWeight = p.strokeWeight;
  }
  if (p.effects !== undefined && "effects" in node) {
    (node as BlendMixin).effects = toEffects(p.effects);
  }
  applyCornerRadii(node, p);
  if (typeof p.opacity === "number" && "opacity" in node) {
    (node as BlendMixin).opacity = p.opacity;
    if (type === "FRAME" && p.opacity < 1) {
      ctx.warn(
        "opacity < 1 on a FRAME dims its entire subtree; use figma.overlay({ color, opacity, parentId }) for a scrim rectangle.",
      );
    }
  }
}

interface TokenBinding {
  field: string;
  tokenName: string;
  variable: Variable;
}

/**
 * Collect design-token bindings from the create spec: `fill`/`stroke` values
 * written as "$token/name", plus an explicit `tokens: {field: tokenName}` map
 * (friendly fields like cornerRadius/padding expand to their bindable parts).
 * Every token must resolve to an existing variable — a miss throws
 * INVALID_PARAMS before any node is created.
 */
async function resolveTokenBindings(
  p: Record<string, unknown>,
): Promise<TokenBinding[]> {
  const wanted: Array<{ field: string; tokenName: string }> = [];
  if (typeof p.fill === "string" && p.fill.startsWith("$")) {
    wanted.push({ field: "fills", tokenName: p.fill.slice(1) });
  }
  if (typeof p.stroke === "string" && p.stroke.startsWith("$")) {
    wanted.push({ field: "strokes", tokenName: p.stroke.slice(1) });
  }
  if (typeof p.tokens === "object" && p.tokens !== null) {
    for (const [field, raw] of Object.entries(
      p.tokens as Record<string, unknown>,
    )) {
      const tokenName = String(raw).replace(/^\$/, "");
      for (const f of expandBindableField(field)) {
        wanted.push({ field: f, tokenName });
      }
    }
  }

  const out: TokenBinding[] = [];
  for (const w of wanted) {
    const variable = await findVariableByName(w.tokenName);
    if (!variable) {
      throw err(
        ErrorCode.INVALID_PARAMS,
        `No variable named "${w.tokenName}" (for field "${w.field}"). Nothing was created.`,
        "Run setup_tokens / create_variable first, or check the token name via figma_read get_variables.",
      );
    }
    out.push({ ...w, variable });
  }
  return out;
}

function warnTokenLiteral(fills: unknown, ctx: HandlerContext): void {
  const arr = Array.isArray(fills) ? fills : [fills];
  for (const f of arr) {
    if (typeof f === "string" && isHexColor(f)) {
      ctx.warn(
        "Using a raw hex fill; if a matching design token exists, prefer apply_variable for theme-awareness.",
      );
      return;
    }
  }
}

function applyAutoLayout(
  node: FrameNode,
  p: Record<string, unknown>,
  parent: BaseNode,
  ctx: HandlerContext,
): void {
  const mode = String(p.layoutMode).toUpperCase();
  if (mode === "HORIZONTAL" || mode === "VERTICAL") node.layoutMode = mode;
  // itemSpacing: honor an explicit value (0 included, e.g. seamless lists);
  // otherwise default to 8 rather than Figma's native 0, which glues children
  // edge-to-edge. Warn so the caller can pick a scale value (8/12/16/24…) or 0.
  if (typeof p.itemSpacing === "number") {
    node.itemSpacing = p.itemSpacing;
  } else {
    node.itemSpacing = 8;
    ctx.warn(
      "Auto-layout created without itemSpacing — defaulted the gap to 8px so children aren't glued together. Set itemSpacing on the 4px scale (8/12/16/24…), or 0 for a seamless list.",
    );
  }
  const pad = normalizePadding(p);
  if (typeof pad.left === "number") node.paddingLeft = pad.left;
  if (typeof pad.right === "number") node.paddingRight = pad.right;
  if (typeof pad.top === "number") node.paddingTop = pad.top;
  if (typeof pad.bottom === "number") node.paddingBottom = pad.bottom;
  if (typeof p.primaryAxisSizingMode === "string") {
    node.primaryAxisSizingMode = p.primaryAxisSizingMode as "FIXED" | "AUTO";
  }
  if (typeof p.counterAxisSizingMode === "string") {
    node.counterAxisSizingMode = p.counterAxisSizingMode as "FIXED" | "AUTO";
  } else if (parentHasFixedWidth(parent)) {
    node.counterAxisSizingMode = "FIXED";
    ctx.warn(
      "Auto-layout child under a fixed parent defaulted to counterAxisSizingMode:FIXED. Set it explicitly to override.",
    );
  }
  // How this frame aligns its OWN children (e.g. center a button's label).
  if (typeof p.primaryAxisAlignItems === "string") {
    node.primaryAxisAlignItems = p.primaryAxisAlignItems as
      | "MIN"
      | "MAX"
      | "CENTER"
      | "SPACE_BETWEEN";
  }
  if (typeof p.counterAxisAlignItems === "string") {
    node.counterAxisAlignItems = p.counterAxisAlignItems as
      | "MIN"
      | "MAX"
      | "CENTER"
      | "BASELINE";
  }
}

/**
 * Apply the child-in-auto-layout properties (`layoutAlign`, `layoutGrow`) that
 * decide how a node stretches/grows inside an auto-layout parent. Mirrors the
 * same handling in the `modify` handler so create and modify stay in sync.
 * Guarded by `"layoutAlign" in node` so it is a no-op for nodes that can never
 * be auto-layout children.
 */
function applyChildLayout(node: SceneNode, p: Record<string, unknown>): void {
  if ("layoutAlign" in node && typeof p.layoutAlign === "string") {
    (node as LayoutMixin).layoutAlign = p.layoutAlign as
      | "MIN"
      | "CENTER"
      | "MAX"
      | "STRETCH"
      | "INHERIT";
  }
  if ("layoutGrow" in node && typeof p.layoutGrow === "number") {
    (node as LayoutMixin).layoutGrow = p.layoutGrow;
  }
}

function warnIfClipped(
  node: SceneNode,
  parent: BaseNode,
  ctx: HandlerContext,
): void {
  if (!("clipsContent" in parent) || !(parent as FrameNode).clipsContent) return;
  const pb = parentSize(parent);
  if (!pb || !("x" in node)) return;
  const layout = node as LayoutMixin;
  const box: Box = {
    x: layout.x,
    y: layout.y,
    w: "width" in node ? layout.width : 0,
    h: "height" in node ? layout.height : 0,
  };
  if (overflowsParent(box, pb)) {
    ctx.warn(
      `Node will be clipped by its parent (bounds ${round(box.x)},${round(box.y)} ${round(box.w)}×${round(box.h)} exceed parent ${round(pb.w)}×${round(pb.h)}).`,
    );
  }
}

/**
 * Nudge the agent when a freshly-created node will hug-width where full-width
 * was almost certainly intended. Transparent structural frames are normal and
 * intentionally do not trigger a warning.
 */
function warnIfLooksInvisible(
  node: SceneNode,
  p: Record<string, unknown>,
  parent: BaseNode,
  ctx: HandlerContext,
): void {
  // A child of a vertical auto-layout parent that didn't ask for STRETCH
  //    and isn't a full-width helper will hug its content (the button bug).
  if (
    (node.type === "FRAME" ||
      node.type === "COMPONENT" ||
      node.type === "INSTANCE") &&
    parent &&
    "layoutMode" in parent &&
    (parent as FrameNode).layoutMode === "VERTICAL" &&
    "layoutAlign" in node &&
    (node as LayoutMixin).layoutAlign !== "STRETCH" &&
    p.layoutAlign === undefined &&
    p.width === undefined &&
    p.w === undefined &&
    p.inset === undefined
  ) {
    ctx.warn(
      "Child of a vertical layout without layoutAlign:\"STRETCH\" or an explicit width will hug its content (not full-width). Add layoutAlign:\"STRETCH\" for buttons/inputs/cards.",
    );
  }
}

/**
 * Warn when a page-level node was created without an explicit position and its
 * (0,0)-ish box lands on top of existing top-level content. This is the classic
 * trap: `create({ type: "COMPONENT", ... })` with no parentId/x/y drops the node
 * at (0,0), silently overlapping whatever screen already sits there. Only fires
 * for nodes parented directly to the PAGE (nested nodes are positioned by their
 * auto-layout parent, so overlap there is not a mistake).
 */
function warnIfDroppedOnSibling(
  node: SceneNode,
  p: Record<string, unknown>,
  parent: BaseNode,
  ctx: HandlerContext,
): void {
  if (parent.type !== "PAGE") return;
  // Only when the caller did NOT ask for a position — an explicit x/y that
  // overlaps is the caller's own choice, not an accident.
  if (p.x !== undefined || p.y !== undefined || p.inset !== undefined) return;
  if (!("x" in node) || !("width" in node)) return;
  const self = node as LayoutMixin;
  const box: Box = { x: self.x, y: self.y, w: self.width, h: self.height };

  for (const sib of (parent as PageNode).children) {
    if (sib.id === node.id || !("x" in sib) || !("width" in sib)) continue;
    const s = sib as LayoutMixin;
    if (boxesOverlap(box, { x: s.x, y: s.y, w: s.width, h: s.height })) {
      ctx.warn(
        `New ${node.type} "${node.name}" was placed at (${round(box.x)},${round(box.y)}) with no x/y and overlaps existing "${sib.name}". Pass explicit x/y (or move() it) so page-level nodes don't stack at (0,0).`,
      );
      return;
    }
  }
}

/**
 * Warn when a node's solid fill exactly matches its container parent's solid
 * fill — a white-on-white (or bg-on-bg) wrapper that reads as a floating slab
 * instead of sitting on the surface. Structural wrappers should stay
 * transparent; only distinct surfaces (cards, inputs) need their own fill.
 */
function warnIfWrapperFillMatchesParent(
  node: SceneNode,
  parent: BaseNode,
  ctx: HandlerContext,
): void {
  if (node.type !== "FRAME" && node.type !== "COMPONENT") return;
  const nodeHex = firstSolidHex(node);
  const parentHex = firstSolidHex(parent);
  if (!nodeHex || !parentHex) return;
  if (nodeHex.toLowerCase() === parentHex.toLowerCase()) {
    ctx.warn(
      `"${node.name}" has the same fill (${nodeHex}) as its container — a same-colour wrapper reads as a slab. Leave structural wrappers transparent (fills:[]); give only distinct surfaces their own fill.`,
    );
  }
}

/** The hex of a node's first fully-opaque SOLID fill, or null. */
function firstSolidHex(node: BaseNode): string | null {
  if (!("fills" in node)) return null;
  const fills = (node as GeometryMixin).fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return null;
  for (const f of fills) {
    if (f.type === "SOLID" && f.visible !== false && (f.opacity ?? 1) >= 0.999) {
      const { r, g, b } = f.color;
      const to = (c: number) =>
        Math.round(c * 255)
          .toString(16)
          .padStart(2, "0");
      return `#${to(r)}${to(g)}${to(b)}`;
    }
  }
  return null;
}

function applyCornerRadii(
  node: SceneNode,
  p: Record<string, unknown>,
): void {
  const uniform = resolveUniformCornerRadius(p);
  if (uniform !== undefined && "cornerRadius" in node) {
    (node as RectangleNode).cornerRadius = uniform;
  }

  for (const key of [
    "topLeftRadius",
    "topRightRadius",
    "bottomRightRadius",
    "bottomLeftRadius",
  ] as const) {
    if (typeof p[key] === "number" && key in node) {
      (node as unknown as Record<typeof key, number>)[key] = p[key] as number;
    }
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

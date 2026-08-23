/// <reference types="@figma/plugin-typings" />
import { HandlerContext, requireNode } from "../context.js";
import { serializeNode } from "../serialize.js";
import { err } from "../errors.js";
import { ErrorCode } from "../../shared/protocol.js";

/**
 * add_component_property: define a component property (BOOLEAN / TEXT /
 * INSTANCE_SWAP) on a COMPONENT or COMPONENT_SET, and optionally WIRE it to a
 * layer so the property actually drives something:
 *   - BOOLEAN → a layer's visibility ("hasIcon", "showBadge").
 *   - INSTANCE_SWAP → an instance layer's swappable component ("iconLeft").
 *   - TEXT → a text layer's characters ("label").
 * This is what turns a 5×3 variant matrix into a manageable component instead
 * of the 5×3×(icon combos) explosion — icon presence/side become boolean +
 * swap properties, not variant axes. Figma has no create API for these until
 * now (the serializer could read definitions but nothing could write them).
 *
 * VARIANT properties are NOT handled here — those come from createVariants /
 * a COMPONENT_SET's variant axes, not addComponentProperty.
 */

type PropType = "BOOLEAN" | "TEXT" | "INSTANCE_SWAP";

interface PropParams {
  target: ComponentNode | ComponentSetNode;
  name: string;
  type: PropType;
  defaultValue: string | boolean;
  preferredValues?: InstanceSwapPreferredValue[];
  layerId?: string;
}

function normalizeType(raw: unknown): PropType {
  const t = String(raw ?? "").toUpperCase().replace(/[\s-]/g, "_");
  if (t === "BOOLEAN" || t === "BOOL") return "BOOLEAN";
  if (t === "TEXT" || t === "STRING") return "TEXT";
  if (t === "INSTANCE_SWAP" || t === "INSTANCE" || t === "SWAP") {
    return "INSTANCE_SWAP";
  }
  throw err(
    ErrorCode.INVALID_PARAMS,
    `Unknown component property type "${String(raw)}".`,
    "Use BOOLEAN | TEXT | INSTANCE_SWAP. (VARIANT axes come from createVariants, not here.)",
  );
}

/** Validate + coerce the defaultValue for the declared type. */
function coerceDefault(type: PropType, raw: unknown): string | boolean {
  if (type === "BOOLEAN") {
    if (typeof raw === "boolean") return raw;
    if (raw === "true") return true;
    if (raw === "false" || raw === undefined) return false;
    throw err(
      ErrorCode.INVALID_PARAMS,
      `BOOLEAN property default must be true/false (got ${JSON.stringify(raw)}).`,
    );
  }
  if (type === "TEXT") {
    if (typeof raw === "string") return raw;
    if (raw === undefined) return "";
    throw err(
      ErrorCode.INVALID_PARAMS,
      `TEXT property default must be a string (got ${JSON.stringify(raw)}).`,
    );
  }
  // INSTANCE_SWAP default is a component id (or "" for none).
  if (typeof raw === "string") return raw;
  if (raw === undefined) return "";
  throw err(
    ErrorCode.INVALID_PARAMS,
    `INSTANCE_SWAP property default must be a component id string (got ${JSON.stringify(raw)}).`,
  );
}

async function resolveParams(ctx: HandlerContext): Promise<PropParams> {
  const p = ctx.params;
  const node = await requireNode(p.nodeId ?? p.componentId ?? p.id);
  if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
    throw err(
      ErrorCode.INVALID_PARAMS,
      `Node "${node.id}" is a ${node.type}; component properties live on a COMPONENT or COMPONENT_SET.`,
      "For a variant inside a set, add the property to the SET (pass the set's id).",
    );
  }
  // A variant COMPONENT cannot own definitions; they belong to the parent set.
  if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET") {
    throw err(
      ErrorCode.INVALID_PARAMS,
      `"${node.name}" is a variant; add the property to its COMPONENT_SET instead.`,
      `Pass nodeId: "${node.parent.id}".`,
    );
  }

  const name = typeof p.name === "string" ? p.name.trim() : "";
  if (!name) {
    throw err(
      ErrorCode.INVALID_PARAMS,
      "add_component_property requires a property name.",
      'e.g. { nodeId, name: "hasIconLeft", type: "BOOLEAN", defaultValue: false }.',
    );
  }

  const type = normalizeType(p.type);
  const defaultValue = coerceDefault(type, p.defaultValue ?? p.default);

  let preferredValues: InstanceSwapPreferredValue[] | undefined;
  if (type === "INSTANCE_SWAP" && Array.isArray(p.preferredValues)) {
    preferredValues = (p.preferredValues as unknown[])
      .map((v): InstanceSwapPreferredValue | null => {
        const key = typeof v === "string" ? v : (v as { key?: string })?.key;
        return key ? { type: "COMPONENT", key } : null;
      })
      .filter((v): v is InstanceSwapPreferredValue => v !== null);
  }

  return {
    target: node as ComponentNode | ComponentSetNode,
    name,
    type,
    defaultValue,
    preferredValues,
    layerId: typeof p.layerId === "string" ? p.layerId : undefined,
  };
}

/** The componentPropertyReferences field a given property type drives. */
function refField(type: PropType): "visible" | "mainComponent" | "characters" {
  if (type === "BOOLEAN") return "visible";
  if (type === "INSTANCE_SWAP") return "mainComponent";
  return "characters";
}

/**
 * Attach the property reference to a single layer. Returns true if it stuck,
 * false (with a warning) if the layer's type is incompatible with the prop.
 */
function attachRef(
  layer: SceneNode,
  type: PropType,
  propId: string,
  ctx: HandlerContext,
): boolean {
  if (type === "INSTANCE_SWAP" && layer.type !== "INSTANCE") {
    ctx.warn(
      `INSTANCE_SWAP layer "${layer.name}" is ${layer.type}, not INSTANCE; wiring skipped.`,
    );
    return false;
  }
  if (type === "TEXT" && layer.type !== "TEXT") {
    ctx.warn(`TEXT layer "${layer.name}" is ${layer.type}, not TEXT; wiring skipped.`);
    return false;
  }
  const field = refField(type);
  (layer as SceneNode).componentPropertyReferences = {
    ...(layer as SceneNode).componentPropertyReferences,
    [field]: propId,
  };
  return true;
}

/**
 * The name path of `layer` relative to its enclosing variant COMPONENT, e.g.
 * a title inside `meta` → ["meta", "title"]. Returns null when the layer is not
 * inside a variant of `set` (path can't be projected onto siblings).
 */
function variantRelativePath(
  layer: SceneNode,
  set: ComponentSetNode,
): { variant: ComponentNode; path: string[] } | null {
  const path: string[] = [];
  let cur: BaseNode | null = layer;
  while (cur && cur.parent) {
    if (cur.parent.type === "COMPONENT_SET" && cur.parent.id === set.id) {
      return { variant: cur as ComponentNode, path };
    }
    path.unshift(cur.name);
    cur = cur.parent;
  }
  return null;
}

/** Walk a name path from a variant root; null if any segment is missing. */
function resolvePath(variant: ComponentNode, path: string[]): SceneNode | null {
  let node: SceneNode = variant;
  for (const name of path) {
    if (!("children" in node)) return null;
    const next: SceneNode | undefined = (
      node as SceneNode & ChildrenMixin
    ).children.find((c) => c.name === name);
    if (!next) return null;
    node = next;
  }
  return node;
}

/**
 * Wire a freshly-created property to a layer so it actually drives something.
 *
 * When `target` is a COMPONENT_SET, wiring the passed layer alone is not enough:
 * every variant has its own copy of that layer, and Figma does NOT propagate the
 * reference across siblings. An override like { "label#..": "X" } on a non-wired
 * variant then silently no-ops. So we project the layer's name path onto every
 * OTHER variant and wire the matching layer in each — the property then drives
 * the corresponding layer no matter which variant an instance selects.
 */
async function wireLayer(
  target: ComponentNode | ComponentSetNode,
  propId: string,
  type: PropType,
  layerId: string,
  ctx: HandlerContext,
): Promise<void> {
  const layer = await figma.getNodeByIdAsync(layerId);
  if (!layer) {
    ctx.warn(`layerId "${layerId}" not found; property created but not wired.`);
    return;
  }
  try {
    const ok = attachRef(layer as SceneNode, type, propId, ctx);
    if (!ok) return;

    // Propagate to sibling variants when wiring inside a COMPONENT_SET.
    if (target.type !== "COMPONENT_SET") return;
    const located = variantRelativePath(layer as SceneNode, target);
    if (!located) return; // layer wasn't inside a variant of this set

    let propagated = 0;
    let missing = 0;
    for (const variant of target.children) {
      if (variant.type !== "COMPONENT" || variant.id === located.variant.id) {
        continue;
      }
      const sibling = resolvePath(variant, located.path);
      if (!sibling) {
        missing += 1;
        continue;
      }
      if (attachRef(sibling, type, propId, ctx)) propagated += 1;
    }
    if (missing > 0) {
      ctx.warn(
        `Property "${propId}" wired on ${propagated + 1} variant(s); ${missing} variant(s) had no layer at path "${
          located.path.join("/") || located.variant.name
        }" (differing structure — wire those manually).`,
      );
    }
  } catch (e) {
    ctx.warn(
      `Property created but could not wire to layer "${layer.name}": ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
}

export async function addComponentProperty(
  ctx: HandlerContext,
): Promise<unknown> {
  const { target, name, type, defaultValue, preferredValues, layerId } =
    await resolveParams(ctx);

  let propId: string;
  try {
    const options =
      type === "INSTANCE_SWAP" && preferredValues
        ? { preferredValues }
        : undefined;
    propId = target.addComponentProperty(
      name,
      type,
      defaultValue as string | boolean,
      options,
    );
  } catch (e) {
    // Figma throws on duplicate names, bad ids, etc.
    throw err(
      ErrorCode.INVALID_PARAMS,
      `Could not add property "${name}": ${e instanceof Error ? e.message : String(e)}`,
      "Property names must be unique on the component; INSTANCE_SWAP defaults must be a valid component id.",
    );
  }

  if (layerId) {
    await wireLayer(target, propId, type, layerId, ctx);
  }

  return {
    id: target.id,
    propertyId: propId,
    name,
    type,
    defaultValue,
    definitions: target.componentPropertyDefinitions,
    node: serializeNode(target, "compact"),
  };
}

/// <reference types="@figma/plugin-typings" />
import { HandlerContext, requireNode } from "../context.js";
import { rgbToHex } from "../color-util.js";
import { r2 } from "../num.js";

/**
 * audit_design_system: measure how well a subtree CONSUMES the design system.
 * For every node it compares raw values (solid fill/stroke hex, cornerRadius,
 * text fontSize/family) against the LOCAL variables and text styles that
 * actually exist, and flags the case that silently erodes a design system:
 * a value hardcoded to something an existing token/style already expresses,
 * with no binding. This is the verify tool the DS-first workflow was missing —
 * a screen can pass layout_audit (structurally clean) yet be full of hex.
 *
 * It reports findings, it does NOT mutate — apply_design_system (later) will
 * consume the same match logic to rebind.
 */

interface ColorToken {
  name: string;
  hex: string;
}
interface FloatToken {
  name: string;
  value: number;
}

export interface DsIndex {
  colors: ColorToken[];
  floats: FloatToken[];
  /** text style id → name, and a size→names lookup for suggestions. */
  textStyleName: Map<string, string>;
  textStyleBySize: Map<number, string[]>;
}

/** A single compliance finding on one node/field. */
export interface DsFinding {
  id: string;
  name: string;
  type: string;
  field: string;
  /** "hardcoded" (a token/style matches but isn't bound) or "off-system"
   * (no token/style matches this value at all). */
  kind: "hardcoded" | "off-system";
  value: string;
  /** Token/style name(s) that already express this value (usually one). */
  suggestions?: string[];
}

/** Build a finding, classifying by whether any token/style matched. */
function finding(
  base: { id: string; name: string; type: string },
  field: string,
  value: string,
  matches: string[],
): DsFinding {
  return {
    ...base,
    field,
    value,
    kind: matches.length > 0 ? "hardcoded" : "off-system",
    ...(matches.length > 0 ? { suggestions: matches } : {}),
  };
}

/** Resolve a variable's value in its collection's default mode. */
function defaultModeValue(v: Variable, collection: VariableCollection): unknown {
  const modeId = collection.defaultModeId ?? collection.modes[0]?.modeId;
  if (modeId && v.valuesByMode[modeId] !== undefined) return v.valuesByMode[modeId];
  const first = Object.values(v.valuesByMode)[0];
  return first;
}

/** Build the local design-system index once per audit call. */
export async function buildIndex(): Promise<DsIndex> {
  const colors: ColorToken[] = [];
  const floats: FloatToken[] = [];
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  for (const c of collections) {
    for (const id of c.variableIds) {
      const v = await figma.variables.getVariableByIdAsync(id);
      if (!v) continue;
      const val = defaultModeValue(v, c);
      if (v.resolvedType === "COLOR" && val && typeof val === "object" && "r" in val) {
        colors.push({ name: v.name, hex: rgbToHex(val as RGB) });
      } else if (v.resolvedType === "FLOAT" && typeof val === "number") {
        floats.push({ name: v.name, value: val });
      }
    }
  }

  const textStyleName = new Map<string, string>();
  const textStyleBySize = new Map<number, string[]>();
  const styles = await figma.getLocalTextStylesAsync();
  for (const s of styles) {
    textStyleName.set(s.id, s.name);
    if (typeof s.fontSize === "number") {
      const arr = textStyleBySize.get(s.fontSize) ?? [];
      arr.push(s.name);
      textStyleBySize.set(s.fontSize, arr);
    }
  }
  return { colors, floats, textStyleName, textStyleBySize };
}

/**
 * Match a hex to token name(s). Colors are authored as exact hex, so exact
 * matches are rare-enough to usually be unique — but return ALL matches
 * (deterministic order) rather than guessing one, since duplicates DO happen
 * (e.g. ink #000000 and surface-black #000000 mean different things).
 */
function matchColors(hex: string, idx: DsIndex): string[] {
  const lower = hex.toLowerCase();
  return idx.colors
    .filter((c) => c.hex.toLowerCase() === lower)
    .map((c) => c.name)
    .sort();
}

/**
 * Match a number to token name(s), preferring tokens whose name is semantically
 * relevant to the field (a cornerRadius=12 should suggest `radius/sm`, not the
 * `space/sm`=12 that shares the value). Float duplicates are common, so ALWAYS
 * return every candidate — the caller shows them and the human/agent picks.
 */
function matchFloats(value: number, field: string, idx: DsIndex): string[] {
  const hits = idx.floats.filter((f) => f.value === value).map((f) => f.name);
  if (hits.length <= 1) return hits;
  const hint = field === "cornerRadius" ? /(radius|round|corner)/i : null;
  const preferred = hint ? hits.filter((n) => hint.test(n)) : [];
  return (preferred.length > 0 ? preferred : hits).sort();
}

/** First visible SOLID paint's hex + whether it is bound to a variable. */
function solidPaintState(
  paints: unknown,
): { hex: string; bound: boolean } | null {
  if (!Array.isArray(paints)) return null;
  for (const p of paints as Paint[]) {
    if (p && p.type === "SOLID" && p.visible !== false) {
      const bv = (p as { boundVariables?: { color?: unknown } }).boundVariables;
      return { hex: rgbToHex(p.color), bound: !!(bv && bv.color) };
    }
  }
  return null;
}

function isFieldBound(node: SceneNode, field: string): boolean {
  const bv = (node as { boundVariables?: Record<string, unknown> }).boundVariables;
  return !!(bv && bv[field]);
}

/** Audit one node, pushing any findings. */
export function auditNode(node: SceneNode, idx: DsIndex, out: DsFinding[]): void {
  const base = { id: node.id, name: node.name, type: node.type };

  // Fill / stroke color compliance.
  for (const field of ["fills", "strokes"] as const) {
    if (!(field in node)) continue;
    const state = solidPaintState((node as GeometryMixin)[field]);
    if (!state || state.bound) continue; // no solid, or already bound → fine
    out.push(finding(base, field, state.hex, matchColors(state.hex, idx)));
  }

  // cornerRadius compliance (uniform only; mixed corners skipped). Only worth
  // reporting when float tokens exist at all — otherwise there's nothing to
  // bind to and every radius would be noise.
  if ("cornerRadius" in node && idx.floats.length > 0) {
    const cr = (node as RectangleNode).cornerRadius;
    if (typeof cr === "number" && cr !== 0 && !isFieldBound(node, "topLeftRadius")) {
      out.push(finding(base, "cornerRadius", String(cr), matchFloats(cr, "cornerRadius", idx)));
    }
  }

  // Text style compliance: a TEXT node should reference a text style.
  if (node.type === "TEXT") {
    const t = node as TextNode;
    const styleId = t.textStyleId;
    if (typeof styleId === "string" && styleId && idx.textStyleName.has(styleId)) {
      return; // properly styled
    }
    if (typeof t.fontSize === "number") {
      const matches = idx.textStyleBySize.get(t.fontSize) ?? [];
      out.push(finding(base, "textStyle", `${t.fontSize}px`, [...matches].sort()));
    }
  }
}

export async function auditDesignSystem(ctx: HandlerContext): Promise<unknown> {
  const p = ctx.params;
  const root = await requireNode(p.nodeId ?? p.id);
  const idx = await buildIndex();

  const findings: DsFinding[] = [];
  let scanned = 0;
  const stack: SceneNode[] = [root];
  while (stack.length > 0) {
    const n = stack.pop()!;
    scanned++;
    auditNode(n, idx, findings);
    if ("children" in n) stack.push(...(n as ChildrenMixin).children);
  }

  const hardcoded = findings.filter((f) => f.kind === "hardcoded");
  const offSystem = findings.filter((f) => f.kind === "off-system");
  // Compliance = share of checked fields that are on-system (bound or styled).
  const checked = scanned; // rough denominator by node; fields ≈ nodes
  const score =
    findings.length === 0
      ? 1
      : r2(Math.max(0, 1 - findings.length / Math.max(checked, 1)));

  return {
    root: root.id,
    scanned,
    compliance: score,
    summary: {
      hardcodedCount: hardcoded.length,
      offSystemCount: offSystem.length,
      // The actionable list: values that a token/style already covers.
      hardcoded: hardcoded.slice(0, 100),
    },
    // off-system values need a NEW token or are intentional one-offs.
    offSystem: offSystem.slice(0, 50),
    hint:
      hardcoded.length > 0
        ? "hardcoded findings have a matching token/style — bind them (apply_variable / set_text_style) or re-create with fill:\"$token\" / textStyle."
        : offSystem.length > 0
          ? "No hardcoded-over-token issues. off-system values match no token — add a token or accept as a one-off."
          : "Fully on design system.",
  };
}

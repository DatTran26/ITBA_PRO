import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditDesignSystem } from "../../../src/plugin/handlers/ds-audit.js";
import { makeContext } from "../../../src/plugin/context.js";

/**
 * audit_design_system — the token/style verify layer. Distinguishes:
 *  - hardcoded: a raw value that an existing token/style already covers, not
 *    bound (the erosion case a design system must catch).
 *  - off-system: a value no token/style matches (needs a new token, or is a
 *    deliberate one-off).
 * Bound fills / applied text styles must NOT be flagged.
 */

function ctx(params: Record<string, unknown>) {
  return makeContext(params, () => {});
}

// Minimal solid paint helpers.
function solid(hex: string, bound = false): any {
  // rgbToHex expects 0..1 channels; encode a few known hexes exactly.
  const map: Record<string, { r: number; g: number; b: number }> = {
    "#35ed7e": { r: 0x35 / 255, g: 0xed / 255, b: 0x7e / 255 },
    "#5865f2": { r: 0x58 / 255, g: 0x65 / 255, b: 0xf2 / 255 },
    "#123456": { r: 0x12 / 255, g: 0x34 / 255, b: 0x56 / 255 },
  };
  const p: any = { type: "SOLID", visible: true, color: map[hex] };
  if (bound) p.boundVariables = { color: { type: "VARIABLE_ALIAS", id: "v-green" } };
  return p;
}

let localVars: any[];
let localTextStyles: any[];

beforeEach(() => {
  // color/green = #35ed7e, color/primary = #5865f2, radius/sm = 12
  localVars = [
    { id: "v-green", name: "color/green", resolvedType: "COLOR", valuesByMode: { m1: { r: 0x35 / 255, g: 0xed / 255, b: 0x7e / 255 } } },
    { id: "v-primary", name: "color/primary", resolvedType: "COLOR", valuesByMode: { m1: { r: 0x58 / 255, g: 0x65 / 255, b: 0xf2 / 255 } } },
    { id: "v-radius", name: "radius/sm", resolvedType: "FLOAT", valuesByMode: { m1: 12 } },
  ];
  localTextStyles = [
    { id: "S:hero", name: "display-xl", fontSize: 82 },
    { id: "S:body", name: "body", fontSize: 16 },
  ];
  (globalThis as any).figma = {
    mixed: Symbol("mixed"),
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(async () => [
        { defaultModeId: "m1", modes: [{ modeId: "m1" }], variableIds: localVars.map((v) => v.id) },
      ]),
      getVariableByIdAsync: vi.fn(async (id: string) => localVars.find((v) => v.id === id) ?? null),
    },
    getLocalTextStylesAsync: vi.fn(async () => localTextStyles),
    getNodeByIdAsync: vi.fn(async () => null),
  };
});

function mountTree(root: any) {
  (globalThis as any).figma.getNodeByIdAsync = vi.fn(async (id: string) =>
    id === root.id ? root : null,
  );
}

describe("auditDesignSystem", () => {
  it("flags a hardcoded fill that matches an existing token", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "btn",
      fills: [solid("#35ed7e")], // matches color/green, not bound
      strokes: [],
      cornerRadius: 0,
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.summary.hardcodedCount).toBe(1);
    const f = res.summary.hardcoded[0];
    expect(f.field).toBe("fills");
    expect(f.kind).toBe("hardcoded");
    expect(f.suggestions).toContain("color/green");
    expect(res.compliance).toBeLessThan(1);
  });

  it("does NOT flag a fill already bound to a variable", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "btn",
      fills: [solid("#35ed7e", true)],
      strokes: [],
      cornerRadius: 0,
      boundVariables: {},
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.summary.hardcodedCount).toBe(0);
    expect(res.summary.offSystemCount).toBe(0);
    expect(res.compliance).toBe(1);
  });

  it("classifies a fill matching no token as off-system", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "odd",
      fills: [solid("#123456")], // no token
      strokes: [],
      cornerRadius: 0,
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.summary.hardcodedCount).toBe(0);
    expect(res.offSystem).toHaveLength(1);
    expect(res.offSystem[0].kind).toBe("off-system");
    expect(res.offSystem[0].suggestions).toBeUndefined();
  });

  it("flags a hardcoded cornerRadius matching radius/sm", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "card",
      fills: [],
      strokes: [],
      cornerRadius: 12,
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    const cr = res.summary.hardcoded.find((f: any) => f.field === "cornerRadius");
    expect(cr).toBeDefined();
    expect(cr.suggestions).toContain("radius/sm");
  });

  it("prefers a radius-named token when several floats share the value 12", async () => {
    // Regression: cornerRadius=12 must suggest radius/sm, not space/sm=12 that
    // happens to share the number. Returns ALL radius-named candidates.
    localVars.push(
      { id: "v-space", name: "space/sm", resolvedType: "FLOAT", valuesByMode: { m1: 12 } },
      { id: "v-radxl", name: "radius/xl", resolvedType: "FLOAT", valuesByMode: { m1: 12 } },
    );
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "card",
      fills: [],
      strokes: [],
      cornerRadius: 12,
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    const cr = res.summary.hardcoded.find((f: any) => f.field === "cornerRadius");
    // Both radius-named tokens survive; the space token (same value) is dropped.
    expect(cr.suggestions).toContain("radius/sm");
    expect(cr.suggestions).toContain("radius/xl");
    expect(cr.suggestions).not.toContain("space/sm");
  });

  it("does NOT flag a cornerRadius bound to a variable", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "card",
      fills: [],
      strokes: [],
      cornerRadius: 12,
      boundVariables: { topLeftRadius: { id: "v-radius" } },
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.summary.hardcodedCount).toBe(0);
  });

  it("flags a TEXT node without a text style (size matches a style)", async () => {
    const root = {
      id: "1:1",
      type: "TEXT",
      name: "title",
      fills: [],
      strokes: [],
      fontSize: 82,
      textStyleId: "",
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    const ts = res.summary.hardcoded.find((f: any) => f.field === "textStyle");
    expect(ts).toBeDefined();
    expect(ts.suggestions).toContain("display-xl");
  });

  it("does NOT flag a TEXT node that references a local text style", async () => {
    const root = {
      id: "1:1",
      type: "TEXT",
      name: "title",
      fills: [],
      strokes: [],
      fontSize: 82,
      textStyleId: "S:hero",
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.summary.hardcodedCount).toBe(0);
  });

  it("walks children and aggregates findings", async () => {
    const child = {
      id: "1:2",
      type: "FRAME",
      name: "inner",
      fills: [solid("#5865f2")], // color/primary, hardcoded
      strokes: [],
      cornerRadius: 0,
    };
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "outer",
      fills: [solid("#35ed7e")], // color/green, hardcoded
      strokes: [],
      cornerRadius: 0,
      children: [child],
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.scanned).toBe(2);
    expect(res.summary.hardcodedCount).toBe(2);
    const names = res.summary.hardcoded.map((f: any) => f.suggestions[0]).sort();
    expect(names).toEqual(["color/green", "color/primary"]);
  });

  it("reports full compliance for a clean subtree", async () => {
    const root = {
      id: "1:1",
      type: "FRAME",
      name: "clean",
      fills: [solid("#35ed7e", true)],
      strokes: [],
      cornerRadius: 0,
      boundVariables: {},
      children: [],
    };
    mountTree(root);
    const res: any = await auditDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.compliance).toBe(1);
    expect(res.hint).toMatch(/Fully on design system/);
  });
});

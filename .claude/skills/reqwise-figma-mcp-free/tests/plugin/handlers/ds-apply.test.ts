import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyDesignSystem } from "../../../src/plugin/handlers/ds-apply.js";
import { makeContext } from "../../../src/plugin/context.js";

/**
 * apply_design_system — write counterpart of audit_design_system. Auto-binds
 * ONLY unambiguous findings (exactly one matching token/style); ambiguous ones
 * go to needsChoice untouched, off-system ones are left alone. dryRun previews
 * without mutating. This is the "draw fast, normalise after" tool.
 */

function ctx(params: Record<string, unknown>) {
  return makeContext(params, () => {});
}

function solid(hex: string): any {
  const map: Record<string, { r: number; g: number; b: number }> = {
    "#35ed7e": { r: 0x35 / 255, g: 0xed / 255, b: 0x7e / 255 },
    "#000000": { r: 0, g: 0, b: 0 },
    "#123456": { r: 0x12 / 255, g: 0x34 / 255, b: 0x56 / 255 },
  };
  return { type: "SOLID", visible: true, color: map[hex] };
}

let localVars: any[];
let localTextStyles: any[];
let setBoundForPaint: any;

beforeEach(() => {
  localVars = [
    { id: "v-green", name: "color/green", resolvedType: "COLOR", valuesByMode: { m1: { r: 0x35 / 255, g: 0xed / 255, b: 0x7e / 255 } } },
    // two black tokens → ambiguous
    { id: "v-ink", name: "color/ink-dark", resolvedType: "COLOR", valuesByMode: { m1: { r: 0, g: 0, b: 0 } } },
    { id: "v-black", name: "color/surface-black", resolvedType: "COLOR", valuesByMode: { m1: { r: 0, g: 0, b: 0 } } },
    { id: "v-radius", name: "radius/sm", resolvedType: "FLOAT", valuesByMode: { m1: 12 } },
  ];
  localTextStyles = [{ id: "S:hero", name: "display-xl", fontSize: 82 }];
  setBoundForPaint = vi.fn((base: any, field: string, variable: any) => ({
    ...base,
    boundVariables: { [field]: { type: "VARIABLE_ALIAS", id: variable.id } },
  }));
  (globalThis as any).figma = {
    mixed: Symbol("mixed"),
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(async () => [
        { defaultModeId: "m1", modes: [{ modeId: "m1" }], variableIds: localVars.map((v) => v.id) },
      ]),
      getVariableByIdAsync: vi.fn(async (id: string) => localVars.find((v) => v.id === id) ?? null),
      getLocalVariablesAsync: vi.fn(async () => localVars),
      setBoundVariableForPaint: setBoundForPaint,
    },
    getLocalTextStylesAsync: vi.fn(async () => localTextStyles),
    getNodeByIdAsync: vi.fn(async () => null),
    loadFontAsync: vi.fn(async () => {}),
  };
});

// findVariableByName walks collections; mirror the real lookup path.
function wireVarLookup() {
  (globalThis as any).figma.variables.getLocalVariableCollectionsAsync = vi.fn(async () => [
    { defaultModeId: "m1", modes: [{ modeId: "m1" }], variableIds: localVars.map((v) => v.id) },
  ]);
}

function mount(root: any) {
  (globalThis as any).figma.getNodeByIdAsync = vi.fn(async (id: string) =>
    id === root.id ? root : null,
  );
}

describe("applyDesignSystem", () => {
  beforeEach(wireVarLookup);

  it("binds an unambiguous hardcoded fill to its token", async () => {
    const root = {
      id: "1:1", type: "FRAME", name: "btn",
      fills: [solid("#35ed7e")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.appliedCount).toBe(1);
    expect(res.applied[0].boundTo).toBe("color/green");
    // fill was replaced with a bound paint
    expect(root.fills[0].boundVariables.color.id).toBe("v-green");
  });

  it("dryRun reports the change WITHOUT mutating", async () => {
    const root = {
      id: "1:1", type: "FRAME", name: "btn",
      fills: [solid("#35ed7e")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1", dryRun: true }));
    expect(res.dryRun).toBe(true);
    expect(res.appliedCount).toBe(1);
    expect(res.applied[0].boundTo).toBe("color/green");
    // untouched: still a raw solid, no binding
    expect(root.fills[0].boundVariables).toBeUndefined();
    expect(setBoundForPaint).not.toHaveBeenCalled();
  });

  it("leaves an ambiguous fill (#000000 → 2 tokens) in needsChoice, unbound", async () => {
    const root = {
      id: "1:1", type: "FRAME", name: "text",
      fills: [solid("#000000")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.appliedCount).toBe(0);
    expect(res.needsChoiceCount).toBe(1);
    expect(res.needsChoice[0].suggestions).toEqual([
      "color/ink-dark",
      "color/surface-black",
    ]);
    expect(root.fills[0].boundVariables).toBeUndefined();
  });

  it("leaves off-system values untouched", async () => {
    const root = {
      id: "1:1", type: "FRAME", name: "odd",
      fills: [solid("#123456")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.appliedCount).toBe(0);
    expect(res.offSystemCount).toBe(1);
  });

  it("binds a cornerRadius when exactly one radius token matches", async () => {
    const calls: any[] = [];
    const root = {
      id: "1:1", type: "FRAME", name: "card",
      fills: [], strokes: [], cornerRadius: 12,
      setBoundVariable: vi.fn((field: string, v: any) => calls.push([field, v.id])),
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.appliedCount).toBe(1);
    expect(res.applied[0].boundTo).toBe("radius/sm");
    // cornerRadius expands to all four corners
    expect(calls.map((c) => c[0])).toEqual([
      "topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius",
    ]);
  });

  it("applies a text style to a TEXT node with no style", async () => {
    const root = {
      id: "1:1", type: "TEXT", name: "title",
      fills: [], strokes: [], fontSize: 82, textStyleId: "",
      fontName: { family: "Inter", style: "Bold" },
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.appliedCount).toBe(1);
    expect(res.applied[0].field).toBe("textStyle");
    expect(root.textStyleId).toBe("S:hero");
  });

  it("aggregates over a subtree and reports mixed outcomes", async () => {
    const child = {
      id: "1:2", type: "FRAME", name: "amb",
      fills: [solid("#000000")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
    };
    const root = {
      id: "1:1", type: "FRAME", name: "root",
      fills: [solid("#35ed7e")], strokes: [], cornerRadius: 0,
      setBoundVariable: vi.fn(),
      children: [child],
    };
    mount(root);
    const res: any = await applyDesignSystem(ctx({ nodeId: "1:1" }));
    expect(res.scanned).toBe(2);
    expect(res.appliedCount).toBe(1); // green bound
    expect(res.needsChoiceCount).toBe(1); // black ambiguous
  });
});

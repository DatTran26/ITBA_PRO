import { beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "../../../src/plugin/handlers/create.js";
import { makeContext } from "../../../src/plugin/context.js";

/**
 * Proactive create-time guards (warnings, never blocking) for two silent traps:
 *  1. A page-level node created with no x/y drops at (0,0) and overlaps an
 *     existing screen — the "component stacked on Home" bug.
 *  2. A container's fill exactly matches its parent's fill — a same-colour
 *     wrapper that reads as a slab instead of sitting on the surface.
 */

function ctx(params: Record<string, unknown>) {
  return makeContext(params, () => {});
}

let page: any;

function solid(hex: { r: number; g: number; b: number }) {
  return [{ type: "SOLID", color: hex }];
}

function fakeFrame(id = "10:1"): any {
  return {
    id,
    type: "FRAME",
    name: "",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    visible: true,
    opacity: 1,
    layoutMode: "NONE",
    clipsContent: false,
    fills: solid({ r: 1, g: 1, b: 1 }),
    strokes: [],
    children: [],
    appendChild(n: any) {
      this.children.push(n);
      n.parent = this;
    },
    insertChild(i: number, n: any) {
      this.children.splice(i, 0, n);
      n.parent = this;
    },
    resize(w: number, h: number) {
      this.width = w;
      this.height = h;
    },
    setBoundVariable: vi.fn(),
  };
}

/** A pre-existing top-level screen sitting at (0,0). */
function existingScreen(): any {
  return {
    id: "9:1",
    type: "FRAME",
    name: "Wallet/Screen/Home",
    x: 0,
    y: 0,
    width: 390,
    height: 844,
  };
}

beforeEach(() => {
  page = {
    id: "0:1",
    type: "PAGE",
    children: [],
    appendChild(n: any) {
      this.children.push(n);
      n.parent = this;
    },
    insertChild(i: number, n: any) {
      this.children.splice(i, 0, n);
      n.parent = this;
    },
  };
  let seq = 0;
  (globalThis as any).figma = {
    currentPage: page,
    mixed: Symbol("mixed"),
    getNodeByIdAsync: vi.fn(async (id: string) =>
      id === "0:1" ? page : page.children.find((c: any) => c.id === id) ?? null,
    ),
    createFrame: vi.fn(() => fakeFrame(`10:${++seq}`)),
    createComponent: vi.fn(() => {
      const n = fakeFrame(`20:${++seq}`);
      n.type = "COMPONENT";
      return n;
    }),
  };
});

describe("warnIfDroppedOnSibling", () => {
  it("warns when a page-level component with no x/y overlaps an existing screen", async () => {
    page.children.push(existingScreen());
    const c = ctx({ type: "COMPONENT", width: 342, height: 68 });
    await create(c);
    expect(
      c.warnings.some((w) => /no x\/y|overlaps|stack/.test(w)),
    ).toBe(true);
  });

  it("does NOT warn when explicit x/y is given (caller's choice)", async () => {
    page.children.push(existingScreen());
    const c = ctx({ type: "COMPONENT", width: 342, height: 68, x: 0, y: -900 });
    await create(c);
    expect(c.warnings.some((w) => /overlaps/.test(w))).toBe(false);
  });

  it("does NOT warn for a nested node (positioned by its parent, not the page)", async () => {
    const parent = fakeFrame("11:1");
    parent.layoutMode = "VERTICAL";
    page.children.push(parent);
    (globalThis as any).figma.getNodeByIdAsync = vi.fn(async (id: string) =>
      id === "11:1" ? parent : id === "0:1" ? page : null,
    );
    const c = ctx({ type: "FRAME", parentId: "11:1", width: 50, height: 50 });
    await create(c);
    expect(c.warnings.some((w) => /overlaps/.test(w))).toBe(false);
  });
});

describe("warnIfWrapperFillMatchesParent", () => {
  it("warns when a child frame's fill equals its container parent's fill", async () => {
    const parent = fakeFrame("12:1"); // white parent
    parent.fills = solid({ r: 1, g: 1, b: 1 });
    page.children.push(parent);
    (globalThis as any).figma.getNodeByIdAsync = vi.fn(async (id: string) =>
      id === "12:1" ? parent : id === "0:1" ? page : null,
    );
    const c = ctx({ type: "FRAME", parentId: "12:1", fill: "#ffffff" });
    await create(c);
    expect(c.warnings.some((w) => /same fill|slab|transparent/.test(w))).toBe(true);
  });

  it("does NOT warn when child and parent fills differ", async () => {
    const parent = fakeFrame("13:1");
    parent.fills = solid({ r: 0.96, g: 0.96, b: 0.97 }); // grey bg
    page.children.push(parent);
    (globalThis as any).figma.getNodeByIdAsync = vi.fn(async (id: string) =>
      id === "13:1" ? parent : id === "0:1" ? page : null,
    );
    const c = ctx({ type: "FRAME", parentId: "13:1", fill: "#ffffff" });
    await create(c);
    expect(c.warnings.some((w) => /same fill/.test(w))).toBe(false);
  });
});

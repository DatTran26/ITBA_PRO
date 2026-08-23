import { beforeEach, describe, expect, it, vi } from "vitest";
import { addComponentProperty } from "../../../src/plugin/handlers/component-props.js";
import { makeContext } from "../../../src/plugin/context.js";

/**
 * add_component_property — the create API for BOOLEAN / TEXT / INSTANCE_SWAP
 * component properties (the serializer could read definitions; nothing could
 * write them). Wiring to a layer drives visibility / swap / characters. Bad
 * target (variant, non-component) and bad type/default throw INVALID_PARAMS.
 */

function ctx(params: Record<string, unknown>) {
  return makeContext(params, () => {});
}

let nodes: Record<string, any>;

function fakeComponent(id: string, extra: Record<string, unknown> = {}): any {
  const defs: Record<string, unknown> = {};
  return {
    id,
    type: "COMPONENT",
    name: `Comp ${id}`,
    x: 0, y: 0, width: 100, height: 40,
    componentPropertyDefinitions: defs,
    addComponentProperty: vi.fn((name: string, type: string, def: unknown) => {
      const propId = `${name}#${Object.keys(defs).length}`;
      defs[propId] = { type, defaultValue: def };
      return propId;
    }),
    ...extra,
  };
}

beforeEach(() => {
  nodes = {};
  (globalThis as any).figma = {
    mixed: Symbol("mixed"),
    getNodeByIdAsync: vi.fn(async (id: string) => nodes[id] ?? null),
  };
});

function mount(...ns: any[]) {
  for (const n of ns) nodes[n.id] = n;
}

describe("addComponentProperty", () => {
  it("adds a BOOLEAN property with a default", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    const res: any = await addComponentProperty(
      ctx({ nodeId: "1:1", name: "hasIconLeft", type: "BOOLEAN", defaultValue: false }),
    );
    expect(comp.addComponentProperty).toHaveBeenCalledWith(
      "hasIconLeft", "BOOLEAN", false, undefined,
    );
    expect(res.type).toBe("BOOLEAN");
    expect(res.propertyId).toMatch(/^hasIconLeft#/);
  });

  it("coerces string 'true'/'false' for BOOLEAN default", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    await addComponentProperty(
      ctx({ nodeId: "1:1", name: "on", type: "BOOLEAN", defaultValue: "true" }),
    );
    expect(comp.addComponentProperty).toHaveBeenCalledWith("on", "BOOLEAN", true, undefined);
  });

  it("adds a TEXT property (default empty string)", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    await addComponentProperty(ctx({ nodeId: "1:1", name: "label", type: "TEXT" }));
    expect(comp.addComponentProperty).toHaveBeenCalledWith("label", "TEXT", "", undefined);
  });

  it("normalizes type aliases (instance-swap → INSTANCE_SWAP)", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    const res: any = await addComponentProperty(
      ctx({ nodeId: "1:1", name: "icon", type: "instance-swap", defaultValue: "9:9" }),
    );
    expect(res.type).toBe("INSTANCE_SWAP");
    expect(comp.addComponentProperty).toHaveBeenCalledWith(
      "icon", "INSTANCE_SWAP", "9:9", undefined,
    );
  });

  it("wires a BOOLEAN property to a layer's visibility", async () => {
    const comp = fakeComponent("1:1");
    const layer: any = { id: "1:2", type: "FRAME", name: "iconSlot", componentPropertyReferences: {} };
    mount(comp, layer);
    await addComponentProperty(
      ctx({ nodeId: "1:1", name: "hasIcon", type: "BOOLEAN", defaultValue: true, layerId: "1:2" }),
    );
    expect(layer.componentPropertyReferences.visible).toMatch(/^hasIcon#/);
  });

  it("wires an INSTANCE_SWAP property to an instance layer's mainComponent", async () => {
    const comp = fakeComponent("1:1");
    const inst: any = { id: "1:3", type: "INSTANCE", name: "icon", componentPropertyReferences: {} };
    mount(comp, inst);
    await addComponentProperty(
      ctx({ nodeId: "1:1", name: "icon", type: "INSTANCE_SWAP", defaultValue: "", layerId: "1:3" }),
    );
    expect(inst.componentPropertyReferences.mainComponent).toMatch(/^icon#/);
  });

  it("warns (not throws) when INSTANCE_SWAP layer is not an instance", async () => {
    const comp = fakeComponent("1:1");
    const layer: any = { id: "1:4", type: "FRAME", name: "notInstance", componentPropertyReferences: {} };
    mount(comp, layer);
    const c = ctx({ nodeId: "1:1", name: "icon", type: "INSTANCE_SWAP", defaultValue: "", layerId: "1:4" });
    await addComponentProperty(c);
    expect(c.warnings.some((w) => /not INSTANCE|INSTANCE/.test(w))).toBe(true);
    expect(layer.componentPropertyReferences.mainComponent).toBeUndefined();
  });

  it("throws INVALID_PARAMS on an unknown type", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    await expect(
      addComponentProperty(ctx({ nodeId: "1:1", name: "x", type: "COLOR" })),
    ).rejects.toMatchObject({ code: "INVALID_PARAMS" });
  });

  it("throws when target is a variant COMPONENT (points at the set)", async () => {
    const set = { id: "1:0", type: "COMPONENT_SET" };
    const variant = fakeComponent("1:1", { parent: set });
    mount(variant);
    await expect(
      addComponentProperty(ctx({ nodeId: "1:1", name: "x", type: "BOOLEAN" })),
    ).rejects.toMatchObject({
      code: "INVALID_PARAMS",
      hint: expect.stringContaining("1:0"),
    });
  });

  it("throws when target is not a component at all", async () => {
    const frame = { id: "1:1", type: "FRAME", name: "plain" };
    mount(frame);
    await expect(
      addComponentProperty(ctx({ nodeId: "1:1", name: "x", type: "BOOLEAN" })),
    ).rejects.toMatchObject({ code: "INVALID_PARAMS" });
  });

  it("throws when the name is missing", async () => {
    const comp = fakeComponent("1:1");
    mount(comp);
    await expect(
      addComponentProperty(ctx({ nodeId: "1:1", type: "BOOLEAN" })),
    ).rejects.toMatchObject({ code: "INVALID_PARAMS" });
  });

  it("surfaces Figma's duplicate-name error as INVALID_PARAMS", async () => {
    const comp = fakeComponent("1:1");
    comp.addComponentProperty = vi.fn(() => {
      throw new Error("Property name already in use");
    });
    mount(comp);
    await expect(
      addComponentProperty(ctx({ nodeId: "1:1", name: "dup", type: "BOOLEAN" })),
    ).rejects.toMatchObject({
      code: "INVALID_PARAMS",
      message: expect.stringContaining("dup"),
    });
  });

  it("propagates a TEXT wire to the same layer in every sibling variant", async () => {
    // A set with two variants, each having meta/title. Wiring the property to
    // the first variant's title MUST also wire the second variant's title —
    // otherwise instance overrides on the non-wired variant silently no-op.
    const titleA: any = { id: "3:11", type: "TEXT", name: "title", componentPropertyReferences: {} };
    const metaA: any = { id: "3:10", type: "FRAME", name: "meta", children: [titleA] };
    const titleB: any = { id: "3:21", type: "TEXT", name: "title", componentPropertyReferences: {} };
    const metaB: any = { id: "3:20", type: "FRAME", name: "meta", children: [titleB] };
    const variantA: any = { id: "3:1", type: "COMPONENT", name: "Type=received", children: [metaA] };
    const variantB: any = { id: "3:2", type: "COMPONENT", name: "Type=spent", children: [metaB] };
    const set: any = {
      id: "3:0", type: "COMPONENT_SET", name: "TxnRow", x: 0, y: 0, width: 200, height: 100,
      componentPropertyDefinitions: {}, children: [variantA, variantB],
      addComponentProperty: vi.fn((name: string) => `${name}#0`),
    };
    // parent links so variantRelativePath can climb from the layer to the set
    metaA.parent = variantA; titleA.parent = metaA; variantA.parent = set;
    metaB.parent = variantB; titleB.parent = metaB; variantB.parent = set;
    mount(set, variantA, variantB, metaA, titleA, metaB, titleB);

    const c = ctx({ nodeId: "3:0", name: "title", type: "TEXT", defaultValue: "x", layerId: "3:11" });
    await addComponentProperty(c);
    expect(titleA.componentPropertyReferences.characters).toBe("title#0");
    expect(titleB.componentPropertyReferences.characters).toBe("title#0");
    expect(c.warnings).toHaveLength(0);
  });

  it("warns when a sibling variant lacks the layer at the same path", async () => {
    const titleA: any = { id: "4:11", type: "TEXT", name: "title", componentPropertyReferences: {} };
    const variantA: any = { id: "4:1", type: "COMPONENT", name: "State=default", children: [titleA] };
    const variantB: any = { id: "4:2", type: "COMPONENT", name: "State=alt", children: [] };
    const set: any = {
      id: "4:0", type: "COMPONENT_SET", name: "Odd", x: 0, y: 0, width: 200, height: 100,
      componentPropertyDefinitions: {}, children: [variantA, variantB],
      addComponentProperty: vi.fn((name: string) => `${name}#0`),
    };
    titleA.parent = variantA; variantA.parent = set; variantB.parent = set;
    mount(set, variantA, variantB, titleA);

    const c = ctx({ nodeId: "4:0", name: "title", type: "TEXT", defaultValue: "x", layerId: "4:11" });
    await addComponentProperty(c);
    expect(titleA.componentPropertyReferences.characters).toBe("title#0");
    expect(c.warnings.some((w) => /variant/.test(w))).toBe(true);
  });

  it("adds an INSTANCE_SWAP property to a COMPONENT_SET", async () => {
    const set: any = {
      id: "2:0", type: "COMPONENT_SET", name: "Button", x: 0, y: 0, width: 200, height: 100,
      componentPropertyDefinitions: {},
      addComponentProperty: vi.fn(() => "icon#0"),
    };
    mount(set);
    const res: any = await addComponentProperty(
      ctx({ nodeId: "2:0", name: "icon", type: "INSTANCE_SWAP", defaultValue: "" }),
    );
    expect(res.propertyId).toBe("icon#0");
  });
});

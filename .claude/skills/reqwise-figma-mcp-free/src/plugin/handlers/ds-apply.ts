/// <reference types="@figma/plugin-typings" />
import { HandlerContext, requireNode } from "../context.js";
import { err } from "../errors.js";
import { ErrorCode } from "../../shared/protocol.js";
import {
  buildIndex,
  auditNode,
  DsFinding,
} from "./ds-audit.js";
import {
  findVariableByName,
  bindVariableToField,
  expandBindableField,
} from "./tokens.js";
import { resolveTextStyle, applyTextStyleToNode } from "./styles.js";

/**
 * apply_design_system: the write counterpart of audit_design_system. It runs
 * the same compliance scan, then AUTO-BINDS every finding that is
 * unambiguous — a `hardcoded` value whose `suggestions` list is exactly one
 * token/style. Ambiguous findings (several tokens share the value, e.g.
 * #000000 → ink-dark|surface-black, or a radius that matches several radius
 * tokens) are NEVER guessed; they are returned under `needsChoice` for a human
 * or agent to resolve with apply_variable / set_text_style. off-system values
 * (no token matches) are returned under `offSystem` untouched.
 *
 * dryRun:true reports exactly what WOULD change without mutating — the safe way
 * to preview normalising a hand-drawn screen before committing.
 */

interface AppliedChange {
  id: string;
  name: string;
  field: string;
  value: string;
  boundTo: string;
}

/** Map a finding's field to the concrete bind action. Returns the token/style
 * name used, or throws so the caller can record a failure. */
async function bindFinding(
  node: SceneNode,
  field: string,
  tokenName: string,
): Promise<void> {
  if (field === "textStyle") {
    if (node.type !== "TEXT") {
      throw new Error(`textStyle finding on non-TEXT node ${node.type}`);
    }
    const style = await resolveTextStyle(tokenName);
    await applyTextStyleToNode(node as TextNode, style);
    return;
  }
  // fills / strokes / cornerRadius → variable binding.
  const variable = await findVariableByName(tokenName);
  if (!variable) {
    throw new Error(`token "${tokenName}" no longer exists`);
  }
  for (const f of expandBindableField(field)) {
    bindVariableToField(node, f, variable);
  }
}

export async function applyDesignSystem(ctx: HandlerContext): Promise<unknown> {
  const p = ctx.params;
  const root = await requireNode(p.nodeId ?? p.id);
  const dryRun = p.dryRun === true;
  const idx = await buildIndex();

  // Walk once, keeping node refs so we can bind in place.
  const applied: AppliedChange[] = [];
  const needsChoice: DsFinding[] = [];
  const offSystem: DsFinding[] = [];
  const failed: Array<{ id: string; field: string; reason: string }> = [];
  let scanned = 0;

  const stack: SceneNode[] = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    scanned++;
    const findings: DsFinding[] = [];
    auditNode(node, idx, findings);

    for (const f of findings) {
      if (f.kind === "off-system") {
        offSystem.push(f);
        continue;
      }
      const suggestions = f.suggestions ?? [];
      if (suggestions.length !== 1) {
        needsChoice.push(f);
        continue;
      }
      const tokenName = suggestions[0]!;
      if (dryRun) {
        applied.push({
          id: f.id,
          name: f.name,
          field: f.field,
          value: f.value,
          boundTo: tokenName,
        });
        continue;
      }
      try {
        await bindFinding(node, f.field, tokenName);
        applied.push({
          id: f.id,
          name: f.name,
          field: f.field,
          value: f.value,
          boundTo: tokenName,
        });
      } catch (e) {
        failed.push({
          id: f.id,
          field: f.field,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if ("children" in node) stack.push(...(node as ChildrenMixin).children);
  }

  return {
    root: root.id,
    dryRun,
    scanned,
    appliedCount: applied.length,
    applied: applied.slice(0, 200),
    needsChoiceCount: needsChoice.length,
    needsChoice: needsChoice.slice(0, 100),
    offSystemCount: offSystem.length,
    offSystem: offSystem.slice(0, 50),
    ...(failed.length > 0 ? { failed } : {}),
    hint: dryRun
      ? "Preview only — re-run with dryRun:false to bind the `applied` list."
      : needsChoice.length > 0
        ? "Ambiguous findings left untouched — resolve each with apply_variable / set_text_style using one of its suggestions."
        : offSystem.length > 0
          ? "All unambiguous values bound. Remaining off-system values match no token — add a token or accept as one-offs."
          : "Subtree fully bound to the design system.",
  };
}

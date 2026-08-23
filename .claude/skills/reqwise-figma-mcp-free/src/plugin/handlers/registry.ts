/// <reference types="@figma/plugin-typings" />
import { Operation, OPERATIONS } from "../../shared/protocol.js";
import { HandlerContext } from "../context.js";

import { create } from "./create.js";
import {
  modify,
  deleteNode,
  move,
  resize,
  group,
  ungroup,
  flatten,
  setSelection,
  zoomToFit,
} from "./write.js";
import {
  clone,
  findComponent,
  findOrCreateComponent,
  instantiate,
  createVariants,
  arrangeComponentSet,
  setComponentDescription,
  componentize,
} from "./components.js";
import { addComponentProperty } from "./component-props.js";
import {
  setupTokens,
  applyVariable,
  createVariable,
  updateVariable,
  renameVariable,
  deleteVariable,
  exportTokens,
  importTokens,
} from "./tokens.js";
import { setText } from "./text.js";
import { loadIcon, loadImage, createPage, setCurrentPage, createOverlay } from "./assets.js";
import {
  getDocumentInfo,
  getSelection,
  getDesignContext,
  getNode,
  getNodes,
  searchNodes,
  scanTextNodes,
  scanNodesByTypes,
  getStyles,
  getVariables,
  getComponents,
  getFonts,
  readSelection,
} from "./read.js";
import {
  getComponent,
  getLibraryComponent,
  getDesignSystemKit,
  generateDesignMd,
  designFingerprint,
} from "./design-system.js";
import { screenshot, exportNode } from "./export.js";
import { layoutAudit } from "./audit.js";
import { auditDesignSystem } from "./ds-audit.js";
import {
  getInstanceOverrides,
  setInstanceOverrides,
  detachInstance,
  resetInstanceOverrides,
} from "./instance-overrides.js";
import {
  setSelectionColors,
  setGradient,
  setEffects,
  setReactions,
} from "./paint-edit.js";
import { setupTextStyles, setTextStyle, setupEffectStyles } from "./styles.js";
import { applyDesignSystem } from "./ds-apply.js";

export type Handler = (ctx: HandlerContext) => Promise<unknown>;

/**
 * The registry is keyed by every Operation in OPERATIONS. A completeness check
 * below guarantees the plugin cannot silently drop an op the protocol declares.
 * `batch` is registered by main.ts (it needs the dispatcher itself), so it maps
 * to a placeholder here and is overridden at wire-up.
 */
export const HANDLERS: Record<Operation, Handler> = {
  // reads
  get_document_info: getDocumentInfo,
  get_selection: getSelection,
  get_design_context: getDesignContext,
  get_node: getNode,
  get_nodes: getNodes,
  search_nodes: searchNodes,
  scan_text_nodes: scanTextNodes,
  scan_nodes_by_types: scanNodesByTypes,
  get_styles: getStyles,
  get_variables: getVariables,
  get_components: getComponents,
  get_component: getComponent,
  get_library_component: getLibraryComponent,
  get_design_system_kit: getDesignSystemKit,
  generate_design_md: generateDesignMd,
  design_fingerprint: designFingerprint,
  screenshot: screenshot,
  export_node: exportNode,
  get_fonts: getFonts,
  export_tokens: exportTokens,
  layout_audit: layoutAudit,
  audit_design_system: auditDesignSystem,
  read_selection: readSelection,
  // writes
  create: create,
  modify: modify,
  delete: deleteNode,
  clone: clone,
  move: move,
  resize: resize,
  group: group,
  ungroup: ungroup,
  flatten: flatten,
  batch: async () => {
    throw new Error("batch handler must be provided by the dispatcher");
  },
  find_component: findComponent,
  find_or_create_component: findOrCreateComponent,
  instantiate: instantiate,
  create_variants: createVariants,
  arrange_component_set: arrangeComponentSet,
  set_component_description: setComponentDescription,
  add_component_property: addComponentProperty,
  componentize: componentize,
  setup_tokens: setupTokens,
  setup_text_styles: setupTextStyles,
  set_text_style: setTextStyle,
  setup_effect_styles: setupEffectStyles,
  apply_variable: applyVariable,
  create_variable: createVariable,
  update_variable: updateVariable,
  rename_variable: renameVariable,
  delete_variable: deleteVariable,
  import_tokens: importTokens,
  set_text: setText,
  load_icon: loadIcon,
  load_image: loadImage,
  create_page: createPage,
  set_current_page: setCurrentPage,
  create_overlay: createOverlay,
  set_selection: setSelection,
  zoom_to_fit: zoomToFit,
  // composite edit-in-place ops
  get_instance_overrides: getInstanceOverrides,
  set_instance_overrides: setInstanceOverrides,
  detach_instance: detachInstance,
  reset_instance_overrides: resetInstanceOverrides,
  set_selection_colors: setSelectionColors,
  set_gradient: setGradient,
  set_effects: setEffects,
  set_reactions: setReactions,
  apply_design_system: applyDesignSystem,
};

/** Compile-time-ish safety net: every declared op has a handler. */
export function assertRegistryComplete(): string[] {
  const missing: string[] = [];
  for (const op of OPERATIONS) {
    if (typeof HANDLERS[op] !== "function") missing.push(op);
  }
  return missing;
}

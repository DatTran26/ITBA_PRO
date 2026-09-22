// Single source of truth: status string → semantic tone → color classes.
// Consumed by ui/status-chip, ui/status-dot. See docs/downtown/design-guidelines.md §4.3.
// Replaces per-feature status→color config maps (was scattered across crm/status-badge consumers).

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ai"
  | "neutral";

const TONE_HEX: Record<StatusTone, string> = {
  success: "var(--success)", // emerald
  warning: "var(--warning)", // amber
  danger: "var(--danger)", // rose
  info: "var(--primary)", // indigo (primary)
  ai: "var(--primary)", // violet
  neutral: "var(--muted-foreground)", // muted
};

export function toneHex(tone: StatusTone): string {
  return TONE_HEX[tone];
}

// Chip: ~14% tint fill + full-strength text (design-guidelines §4.3).
export const toneChipClass: Record<StatusTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-primary/15 text-primary",
  ai: "bg-primary/15 text-primary",
  neutral: "bg-white/[0.06] text-muted-foreground",
};

// Solid dot fill per tone.
export const toneDotClass: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-primary",
  ai: "bg-primary",
  neutral: "bg-muted-foreground",
};

// Common EN/VI domain statuses → tone. Unknown → neutral.
const TONE_BY_STATUS: Record<string, StatusTone> = {
  // success
  active: "success", passed: "success", approved: "success", completed: "success",
  done: "success", success: "success", online: "success", offer: "success", hired: "success",
  "đạt": "success", "hoàn thành": "success", "duyệt": "success", "đã duyệt": "success",
  // warning
  pending: "warning", review: "warning", in_review: "warning",
  screening: "warning", waiting: "warning", scheduled: "warning",
  "chờ duyệt": "warning", "nháp": "warning", "đang xử lý": "warning",
  // danger
  failed: "danger", rejected: "danger", error: "danger", expired: "danger",
  cancelled: "danger", canceled: "danger",
  "từ chối": "danger", "lỗi": "danger", "hết hạn": "danger",
  // neutral
  draft: "neutral", on_hold: "neutral", inactive: "neutral", archived: "neutral",
  // info / ai
  info: "info", new: "info", interview: "info", ai: "ai",
  // CRM domain statuses (person/position/group)
  training_needed: "warning", skill_gap: "danger", ready_for_promotion: "info",
  review_needed: "warning", deprecated: "danger",
  healthy: "success", needs_attention: "warning", understaffed: "warning",
  skill_risk: "danger",
};

export function statusTone(status: string): StatusTone {
  const key = status?.toLowerCase?.().trim();
  return (key && TONE_BY_STATUS[key]) || "neutral";
}

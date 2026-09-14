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
  success: "#34D399", // emerald
  warning: "#FBBF24", // amber
  danger: "#FB7185", // rose
  info: "#5B6CF0", // indigo (primary)
  ai: "#A78BFA", // violet
  neutral: "#8B99B0", // muted
};

export function toneHex(tone: StatusTone): string {
  return TONE_HEX[tone];
}

// Chip: ~14% tint fill + full-strength text (design-guidelines §4.3).
export const toneChipClass: Record<StatusTone, string> = {
  success: "bg-[#34D399]/15 text-[#34D399]",
  warning: "bg-[#FBBF24]/15 text-[#FBBF24]",
  danger: "bg-[#FB7185]/15 text-[#FB7185]",
  info: "bg-[#5B6CF0]/15 text-[#7C8FFF]",
  ai: "bg-[#A78BFA]/15 text-[#A78BFA]",
  neutral: "bg-white/[0.06] text-[#8B99B0]",
};

// Solid dot fill per tone.
export const toneDotClass: Record<StatusTone, string> = {
  success: "bg-[#34D399]",
  warning: "bg-[#FBBF24]",
  danger: "bg-[#FB7185]",
  info: "bg-[#5B6CF0]",
  ai: "bg-[#A78BFA]",
  neutral: "bg-[#8B99B0]",
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

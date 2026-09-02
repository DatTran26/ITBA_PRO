import type {
  PersonStatus,
  PositionStatus,
  GroupStatus,
  NoteType,
  CrmTaskStatus,
} from "@/app/dashboard/management-types";

export const PERSON_STATUSES: Record<PersonStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#22C55E" },
  in_review: { label: "In Review", color: "#F59E0B" },
  training_needed: { label: "Training Needed", color: "#F97316" },
  skill_gap: { label: "Skill Gap", color: "#EF4444" },
  ready_for_promotion: { label: "Ready for Promotion", color: "#7C8FFF" },
  on_hold: { label: "On Hold", color: "#8B99B0" },
  inactive: { label: "Inactive", color: "#5A6882" },
};

export const POSITION_STATUSES: Record<PositionStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#22C55E" },
  draft: { label: "Draft", color: "#8B99B0" },
  review_needed: { label: "Review Needed", color: "#F59E0B" },
  deprecated: { label: "Deprecated", color: "#EF4444" },
  archived: { label: "Archived", color: "#5A6882" },
};

export const GROUP_STATUSES: Record<GroupStatus, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "#22C55E" },
  needs_attention: { label: "Needs Attention", color: "#F59E0B" },
  understaffed: { label: "Understaffed", color: "#F97316" },
  skill_risk: { label: "Skill Risk", color: "#EF4444" },
  inactive: { label: "Inactive", color: "#5A6882" },
};

export const NOTE_TYPES: Record<NoteType, { label: string; color: string }> = {
  general: { label: "General", color: "#8B99B0" },
  warning: { label: "Warning", color: "#EF4444" },
  feedback: { label: "Feedback", color: "#7C8FFF" },
  development: { label: "Development", color: "#22C55E" },
  recruitment: { label: "Recruitment", color: "#B48EFF" },
};

export const TASK_STATUSES: Record<CrmTaskStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#8B99B0" },
  in_progress: { label: "In Progress", color: "#F59E0B" },
  completed: { label: "Completed", color: "#22C55E" },
  cancelled: { label: "Cancelled", color: "#5A6882" },
};

export const VALID_ENTITY_TYPES = new Set(["person", "position", "group", "job_application"]);

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: "Person",
  position: "Position",
  group: "Group",
  skill: "Skill",
};

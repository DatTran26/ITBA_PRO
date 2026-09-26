import type {
  PersonStatus,
  PositionStatus,
  GroupStatus,
  NoteType,
  CrmTaskStatus,
} from "@/app/dashboard/management-types";

export const PERSON_STATUSES: Record<PersonStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "var(--success)" },
  in_review: { label: "In Review", color: "var(--warning)" },
  training_needed: { label: "Training Needed", color: "var(--warning)" },
  skill_gap: { label: "Skill Gap", color: "var(--danger)" },
  ready_for_promotion: { label: "Ready for Promotion", color: "var(--primary)" },
  on_hold: { label: "On Hold", color: "var(--muted-foreground)" },
  inactive: { label: "Inactive", color: "var(--muted-foreground)" },
};

export const POSITION_STATUSES: Record<PositionStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "var(--success)" },
  draft: { label: "Draft", color: "var(--muted-foreground)" },
  review_needed: { label: "Review Needed", color: "var(--warning)" },
  deprecated: { label: "Deprecated", color: "var(--danger)" },
  archived: { label: "Archived", color: "var(--muted-foreground)" },
};

export const GROUP_STATUSES: Record<GroupStatus, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "var(--success)" },
  needs_attention: { label: "Needs Attention", color: "var(--warning)" },
  understaffed: { label: "Understaffed", color: "var(--warning)" },
  skill_risk: { label: "Skill Risk", color: "var(--danger)" },
  inactive: { label: "Inactive", color: "var(--muted-foreground)" },
};

export const NOTE_TYPES: Record<NoteType, { label: string; color: string }> = {
  general: { label: "General", color: "var(--muted-foreground)" },
  warning: { label: "Warning", color: "var(--danger)" },
  feedback: { label: "Feedback", color: "var(--primary)" },
  development: { label: "Development", color: "var(--success)" },
  recruitment: { label: "Recruitment", color: "var(--ai)" },
};

export const TASK_STATUSES: Record<CrmTaskStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "var(--muted-foreground)" },
  in_progress: { label: "In Progress", color: "var(--warning)" },
  completed: { label: "Completed", color: "var(--success)" },
  cancelled: { label: "Cancelled", color: "var(--muted-foreground)" },
};

export const VALID_ENTITY_TYPES = new Set(["person", "position", "group", "job_application"]);

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: "Person",
  position: "Position",
  group: "Group",
  skill: "Skill",
};

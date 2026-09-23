/* Shared types for Persons, Positions, Skills, Groups management pages */

export interface PersonListItem {
  id: string;
  full_name: string;
  email: string | null;
  type: "candidate" | "employee";
  department: string | null;
  current_level: string | null;
  position_id: string | null;
  status: PersonStatus;
  created_at: string;
  /* CRM extensions — populated by expanded server query */
  position_title?: string | null;
  group_names?: string[];
  tags?: TagItem[];
  skills_count?: number;
}

export interface PersonDetail extends PersonListItem {
  phone: string | null;
  notes: string | null;
  joined_date: string | null;
  positions: { title: string; department: string | null } | null;
  updated_at: string;
}

export interface PositionListItem {
  id: string;
  title: string;
  department: string | null;
  target_level: string | null;
  status: PositionStatus;
  position_skill_requirements: { count: number }[] | { count: number };
  created_at: string;
  /* CRM extensions — populated by expanded server query */
  assigned_persons_count?: number;
  tags?: TagItem[];
}

export interface PositionDetail {
  id: string;
  title: string;
  department: string | null;
  target_level: string | null;
  description: string | null;
  status: PositionStatus;
  created_at: string;
  updated_at: string;
  position_skill_requirements: SkillRequirement[];
}

export interface SkillRequirement {
  id: string;
  skill_id: string;
  required_level: number;
  is_mandatory: boolean;
  checklist_order: number;
  skills: { name: string; category: string | null };
}

export interface SkillListItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
  position_count: number;
  person_count: number;
  demand_score: number;
  shortage_score: number;
}

export interface SkillDetail {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
  position_requirements: Array<{
    position_id: string;
    position_title: string;
    department: string | null;
    required_level: number;
    is_mandatory: boolean;
  }>;
  person_skills: Array<{
    person_id: string;
    person_name: string;
    current_level: number;
  }>;
}

export interface GroupListItem {
  id: string;
  name: string;
  type: "department" | "batch" | "campaign" | "other";
  description: string | null;
  status: GroupStatus;
  group_members: { count: number }[] | { count: number };
  created_at: string;
  /* CRM extensions — populated by expanded server query */
  health_score?: number;
  position_count?: number;
  alert_count?: number;
  /** Tên thành viên cho avatar stack (page.tsx join persons). */
  member_names?: string[];
}

export interface GroupDetail extends GroupListItem {
  members: GroupMemberItem[];
  notes?: NoteItem[];
  activity_logs?: ActivityLogItem[];
}

export interface GroupKpis {
  totalGroups: number;
  totalMembers: number;
  activeGroups: number;
  atRiskGroups: number;
}

export interface GroupMemberItem {
  id: string;
  person_id: string;
  added_at: string;
  persons: {
    id: string;
    full_name: string;
    email: string | null;
    type: string;
    department: string | null;
    /** Chỉ có ở trang chi tiết nhóm (page.tsx join) — dùng cho heatmap. */
    person_skills?: { current_level: number; skills: { name: string } | null }[];
  };
}

/* Status types for CRM layer */
export type PersonStatus = "active" | "in_review" | "training_needed" | "skill_gap" | "ready_for_promotion" | "on_hold" | "inactive";
export type PositionStatus = "active" | "draft" | "review_needed" | "deprecated" | "archived";
export type GroupStatus = "healthy" | "needs_attention" | "understaffed" | "skill_risk" | "inactive";
export type NoteType = "general" | "warning" | "feedback" | "development" | "recruitment";
export type CrmTaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type EntityType = "person" | "position" | "group" | "job_application";

/* Person skill mapping */
export interface PersonSkillItem {
  id: string;
  person_id: string;
  skill_id: string;
  current_level: number;
  created_at: string;
  skills: { name: string; category: string | null };
}

/* Notes (polymorphic) */
export interface NoteItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  content: string;
  note_type: NoteType;
  is_pinned: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
  users?: { name: string | null; email: string };
}

/* Activity logs (polymorphic) */
export interface ActivityLogItem {
  id: string;
  entity_type: EntityType | "skill";
  entity_id: string;
  action: string;
  details: Record<string, unknown> | null;
  actor_id: string;
  created_at: string;
  users?: { name: string | null; email: string };
}

/* Tags */
export interface TagItem {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface EntityTagItem {
  id: string;
  tag_id: string;
  entity_type: EntityType;
  entity_id: string;
  tags: TagItem;
}

/* CRM Tasks */
export interface CrmTaskItem {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  title: string;
  description: string | null;
  status: CrmTaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  users?: { name: string | null; email: string };
}

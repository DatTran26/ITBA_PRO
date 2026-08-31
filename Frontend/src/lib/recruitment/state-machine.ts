import type { PipelineStatus } from "@/types/recruitment";

const ALLOWED: Record<PipelineStatus, PipelineStatus[]> = {
  NEW: ["SCREENED", "REJECTED"],
  SCREENED: ["SHORTLISTED", "REJECTED"],
  REJECTED: ["SHORTLISTED"], // restore
  SHORTLISTED: ["INTERVIEW_SCHEDULED", "REJECTED"],
  INTERVIEW_SCHEDULED: ["INTERVIEWED", "REJECTED"],
  INTERVIEWED: ["PASSED", "FAILED"],
  PASSED: ["OFFERED"],
  FAILED: [],
  OFFERED: ["ACCEPTED", "OFFER_REJECTED"],
  ACCEPTED: ["ONBOARDED"],
  OFFER_REJECTED: [],
  ONBOARDED: [],
};

export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: PipelineStatus): PipelineStatus[] {
  return ALLOWED[from] ?? [];
}

export type PipelineStatus =
  | 'NEW'
  | 'SCREENED'
  | 'REJECTED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'PASSED'
  | 'FAILED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'OFFER_REJECTED'
  | 'ONBOARDED';

export type ParseStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// Interface for ScreeningResult returned by the Edge Function AI scorer
export interface ScreeningResult {
  ai_score: number;
  skill_match_score: number;
  experience_match_score: number;
  domain_match_score: number;
  strengths: string[]; // Vietnamese strings
  weaknesses: string[]; // Vietnamese strings
  parsed_cv: Record<string, unknown>;
  ai_provider: string;
  ai_model: string;
  prompt_version: string;
}

// DB row types (nullable fields use | null)
export interface JobDescription {
  id: string;
  title: string;
  role_key: string | null;
  department: string | null;
  seniority: string | null;
  required_skills: Array<{ skill: string; weight?: number }>;
  full_text: string;
  auto_reject_threshold: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CandidateCV {
  id: string;
  person_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  parse_status: ParseStatus;
  detected_language: string | null;
  retry_count: number;
  last_error: string | null;
  processing_started_at: string | null;
  processing_finished_at: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface JobApplication {
  id: string;
  person_id: string;
  job_description_id: string | null;
  cv_id: string | null;
  current_screening_id: string | null;
  pipeline_status: PipelineStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateScreening {
  id: string;
  job_application_id: string;
  ai_score: number | null;
  final_score: number | null;
  skill_match_score: number | null;
  experience_match_score: number | null;
  domain_match_score: number | null;
  strengths_json: string[] | null;
  weaknesses_json: string[] | null;
  parsed_cv_json: Record<string, unknown> | null;
  is_overridden: boolean;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  ai_provider: string | null;
  ai_model: string | null;
  prompt_version: string | null;
  screened_at: string;
}

export interface InterviewSchedule {
  id: string;
  job_application_id: string;
  session_id: string | null;
  interviewer_id: string | null;
  scheduled_at: string;
  timezone: string;
  recruiter_note: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  interviewer_status: 'pending' | 'accepted' | 'declined' | 'reschedule_requested';
  interviewer_proposed_at: string | null;
  interviewer_note: string | null;
  candidate_confirmation: 'pending' | 'confirmed' | 'declined';
  candidate_confirmed_at: string | null;
  confirmation_token: string | null;
  test_link: string | null;
  created_by: string | null;
  created_at: string;
  duration_minutes: number;
  location_type: 'online' | 'office' | 'phone';
  location_detail: string | null;
  interview_round: string;
}

export interface InterviewSession {
  id: string;
  job_description_id: string | null;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: 'online' | 'office' | 'phone';
  location_detail: string | null;
  recruiter_note: string | null;
  notification_sent_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InterviewResult {
  id: string;
  interview_schedule_id: string;
  result: 'pass' | 'fail';
  note: string | null;
  submitted_at: string;
  submitted_by: string | null;
}

export interface CandidateStatusHistory {
  id: string;
  job_application_id: string;
  from_status: PipelineStatus | null;
  to_status: PipelineStatus;
  changed_by: string | null;
  changed_at: string;
  note: string | null;
}

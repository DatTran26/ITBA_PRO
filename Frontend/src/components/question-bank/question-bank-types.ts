export const QUESTION_TYPE_OPTIONS = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "matching", label: "Matching" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "scenario", label: "Scenario-based" },
  { value: "ordering", label: "Ordering / Sequence" },
  { value: "reading_comprehension", label: "Reading Comprehension" },
  { value: "priority_severity", label: "Priority / Severity" },
  { value: "short_case_study", label: "Short Case Study" },
  { value: "image_diagram", label: "Image / Diagram Based" },
  { value: "communication_response", label: "Communication / Response" },
  { value: "short_answer", label: "Short Answer" },
  { value: "sql_logic_code", label: "SQL / Logic / Code" },
] as const;

export const MANUAL_GRADING_TYPES = ["short_answer", "sql_logic_code", "short_case_study"] as const;

export type QuestionType = (typeof QUESTION_TYPE_OPTIONS)[number]["value"];
export type GradingMode = "auto" | "manual";

export interface AnswerPayload {
  options?: string[] | Record<string, string>;
  correct_answer?: string | number | string[] | number[] | boolean | null;
  rubric?: string | string[];
  expected_answer?: string;
  pairs?: Array<{ left: string; right: string }>;
  sequence?: string[];
  blanks?: string[];
  [key: string]: unknown;
}

export interface BankQuestion {
  id: string;
  question_text: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer?: string | null;
  explanation?: string | null;
  points: number;
  time_limit: number;
  level: string;
  topic_tag?: string | null;
  question_type?: QuestionType;
  answer_payload?: AnswerPayload;
  metadata?: Record<string, unknown>;
  grading_mode?: GradingMode;
}

export interface QuestionTypeCount {
  question_type: QuestionType;
  count: number;
}

export interface ShortageItem {
  question_type: QuestionType;
  requested: number;
  available: number;
  missing: number;
  proposed_substitutes: QuestionTypeCount[];
}

export interface ShortageProposal {
  items: ShortageItem[];
  message: string;
}

export interface LevelConfig {
  mode: "single" | "mixed";
  total: number;
  level?: string;
  ratios?: { junior: number; middle: number; senior: number };
  topics?: string[];
  type_counts?: QuestionTypeCount[];
  confirmSubstitution?: boolean;
}

export interface QuestionRow extends BankQuestion {
  created_at: string;
  created_by: string;
}

export interface ImportResult {
  inserted: number[];
  duplicates: { row: number; question_text: string }[];
  errors: { row: number; reason: string }[];
}

export interface AiQuestion {
  question_text: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer?: string | null;
  explanation?: string | null;
  level: string;
  topic_tag?: string | null;
  question_type?: QuestionType;
  answer_payload?: AnswerPayload;
  metadata?: Record<string, unknown>;
  grading_mode?: GradingMode;
  // Verbatim quote AI used as source for the question — persisted to question_bank.source_ref.
  source_excerpt?: string | null;
}

export interface DocumentTopic {
  id: string;
  document_id: string;
  title: string;
  summary: string | null;
  key_points: string[];
  order_index: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentSource {
  id: string;
  file_name: string | null;
  file_url: string | null;
  format: string;
  source_url: string | null;
  status:
    | "pending"
    | "processing"
    | "extracting_topics"
    | "topics_ready"
    | "generating_questions"
    | "done"
    | "failed";
  created_by: string;
  created_at: string;
  document_jobs?: { id: string; status: string; error_message?: string | null }[];
}

export interface LibraryDocument {
  id: string;
  title: string;
  file_type: string;
  source_type: string;
  storage_path?: string | null;
  drive_file_id?: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  document_sources?: { id: string; status: string; created_at: string }[];
}

export interface DocumentJob {
  id: string;
  document_source_id: string;
  job_type: string;
  status: "pending" | "processing" | "done" | "failed";
  result_json: AiQuestion[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

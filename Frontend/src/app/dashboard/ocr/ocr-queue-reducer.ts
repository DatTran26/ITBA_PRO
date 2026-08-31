import type { OCRQueueState, OCRQueueAction } from "./types";

export const initialQueueState: OCRQueueState = {
    jobs: [],
    selectedJobId: null,
    validationError: null,
};

export function ocrQueueReducer(
    state: OCRQueueState,
    action: OCRQueueAction
): OCRQueueState {
    switch (action.type) {
        case "jobs_added": {
            const nextJobs = [...state.jobs, ...action.jobs];
            const nextSelected = state.selectedJobId ?? action.jobs[0]?.id ?? null;
            return {
                ...state,
                jobs: nextJobs,
                selectedJobId: nextSelected,
                validationError: null,
            };
        }
        case "selection_changed":
            return {
                ...state,
                selectedJobId: action.id,
            };
        case "processing_started":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "processing",
                              startedAt: action.startedAt,
                              attemptCount: j.attemptCount + 1,
                              errorMessage: null,
                          }
                        : j
                ),
            };
        case "completed":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "needs_review",
                              originalText: action.text,
                              editedText: action.text,
                              engine: action.engine || null,
                              errorMessage: null,
                          }
                        : j
                ),
            };
        case "failed":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "error",
                              errorMessage: action.message,
                          }
                        : j
                ),
            };
        case "text_edited":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              editedText: action.text,
                          }
                        : j
                ),
            };
        case "confirmed":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "confirmed",
                              confirmedText: j.editedText,
                          }
                        : j
                ),
            };
        case "reopened":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "needs_review",
                              confirmedText: null,
                          }
                        : j
                ),
            };
        case "retried":
            return {
                ...state,
                jobs: state.jobs.map((j) =>
                    j.id === action.id
                        ? {
                              ...j,
                              status: "queued",
                              errorMessage: null,
                          }
                        : j
                ),
            };
        case "removed": {
            const nextJobs = state.jobs.filter((j) => j.id !== action.id);
            let nextSelected = state.selectedJobId;
            if (state.selectedJobId === action.id) {
                nextSelected = nextJobs[0]?.id ?? null;
            }
            return {
                ...state,
                jobs: nextJobs,
                selectedJobId: nextSelected,
            };
        }
        case "clear_all":
            return {
                jobs: [],
                selectedJobId: null,
                validationError: null,
            };
        case "validation_error_set":
            return {
                ...state,
                validationError: action.message,
            };
        default:
            return state;
    }
}

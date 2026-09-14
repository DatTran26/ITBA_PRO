import { describe, expect, it } from "vitest";
import {
  classifyReportActions,
  normalizeReportScope,
  percentage,
  type ReportApplication,
} from "./report";

const NOW = new Date("2026-09-14T03:00:00.000Z");

function application(overrides: Partial<ReportApplication>): ReportApplication {
  return {
    id: "app-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    pipelineStatus: "NEW",
    candidateName: "Ứng viên",
    candidateEmail: "candidate@example.com",
    jobTitle: "Backend Developer",
    department: "Engineering",
    finalScore: null,
    aiScore: null,
    cvStatus: "COMPLETED",
    createdBy: "user-1",
    lastStatusChangeAt: "2026-09-01T00:00:00.000Z",
    interviewSchedules: [],
    ...overrides,
  };
}

describe("report scope and pure report rules", () => {
  it("normalizes a valid local date range and optional filters", () => {
    const result = normalizeReportScope(
      new URLSearchParams("from=2026-01-01&to=2026-01-31&jd_id=11111111-1111-4111-8111-111111111111&department=Engineering"),
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      scope: {
        from: "2026-01-01T00:00:00+07:00",
        to: "2026-01-31T23:59:59.999+07:00",
        jdId: "11111111-1111-4111-8111-111111111111",
        department: "Engineering",
      },
    });
  });

  it("rejects inverted and over-two-year ranges", () => {
    expect(normalizeReportScope(new URLSearchParams("from=2026-02-01&to=2026-01-31"), NOW).ok).toBe(false);
    expect(normalizeReportScope(new URLSearchParams("from=2023-01-01&to=2026-01-01"), NOW).ok).toBe(false);
  });

  it("rejects malformed filter values before they reach the database", () => {
    expect(normalizeReportScope(new URLSearchParams("jd_id=not-a-uuid"), NOW).ok).toBe(false);
    expect(normalizeReportScope(new URLSearchParams(`department=${"x".repeat(121)}`), NOW).ok).toBe(false);
  });

  it("defaults to the last 30 local calendar days", () => {
    const result = normalizeReportScope(new URLSearchParams(), NOW);
    expect(result).toEqual({
      ok: true,
      scope: {
        from: "2026-08-16T00:00:00+07:00",
        to: "2026-09-14T23:59:59.999+07:00",
        jdId: null,
        department: null,
      },
    });
  });

  it("keeps percentage denominators safe", () => {
    expect(percentage(3, 10)).toBe(30);
    expect(percentage(3, 0)).toBe(0);
  });

  it("classifies stale, pending, and unresolved interview actions", () => {
    const actions = classifyReportActions(
      [
        application({ id: "stale", lastStatusChangeAt: "2026-08-30T00:00:00.000Z" }),
        application({ id: "pending", cvStatus: "PROCESSING", lastStatusChangeAt: "2026-09-10T00:00:00.000Z" }),
        application({
          id: "interview",
          pipelineStatus: "INTERVIEW_SCHEDULED",
          lastStatusChangeAt: "2026-09-10T00:00:00.000Z",
          interviewSchedules: [{ scheduledAt: "2026-09-12T00:00:00.000Z", status: "scheduled", result: null, submittedAt: null }],
        }),
      ],
      NOW,
    );

    expect(actions.map((action) => action.type)).toEqual(["INTERVIEW_RESULT", "STALE", "CV_PROCESSING"]);
  });
});

# CV Analyze Fix & Dedicated Scoring Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix infinite loading bug caused by internal HTTP self-call going through Cloudflare Tunnel, and create a dedicated `/cv-analyze` route with polished scoring UI replacing the mixed detail/notes page.

**Architecture:** (1) Fix `upload/route.ts` to use `NEXT_PUBLIC_APP_URL` or localhost fallback instead of request-origin-based URL — bypassing Cloudflare proxy timeout. (2) Create `/dashboard/recruitment/[id]/cv-analyze` as a server-rendered page with a client component that shows loading → polished scoring results. (3) Update all `onSuccess` redirects to point to the new route.

**Tech Stack:** Next.js App Router, React, Supabase Realtime, existing `ScoreCard`/`ScoreBreakdown` components, TailwindCSS

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/app/api/recruitment/upload/route.ts` | Fix internal fetch URL |
| Modify | `src/app/dashboard/hr-dashboard-client.tsx` | Update 2x onSuccess redirect |
| Modify | `src/app/dashboard/recruitment/recruitment-client.tsx` | Update onSuccess redirect |
| Create | `src/app/dashboard/recruitment/[id]/cv-analyze/page.tsx` | Server component: auth + breadcrumb |
| Create | `src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx` | Client: loading + polished results UI |

---

## Task 1: Fix upload route internal fetch URL

**Files:**
- Modify: `src/app/api/recruitment/upload/route.ts:122-132`

Root cause: When using Cloudflare Tunnel, `request.headers.get("origin")` or `host` resolves to the tunnel hostname. The internal self-call goes OUT through Cloudflare (which has ~30s proxy timeout) and back in — getting killed mid-execution, leaving `parse_status = "PROCESSING"` forever.

Fix: use `NEXT_PUBLIC_APP_URL` env var (set in production), fallback to `http://localhost:3000` in dev.

- [ ] **Step 1: Replace lines 122-132 in upload/route.ts**

Replace the existing block:
```ts
// Fire-and-forget: trigger CV analysis via internal API
const origin = request.headers.get("origin") || request.headers.get("host") || "localhost:3000";
const protocol = origin.startsWith("localhost") || origin.startsWith("127.") ? "http" : "https";
const baseUrl = origin.startsWith("http") ? origin : `${protocol}://${origin}`;
fetch(`${baseUrl}/api/recruitment/applications/${applicationId}/cv-analysis`, {
  method: "POST",
  headers: {
    cookie: request.headers.get("cookie") || "",
    authorization: request.headers.get("authorization") || "",
  },
}).catch((err) => console.error("[upload] cv-analysis trigger failed:", err));
```

With:
```ts
// Fire-and-forget: trigger CV analysis via internal API
// Use NEXT_PUBLIC_APP_URL (set in prod) or localhost to bypass reverse-proxy timeouts
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);

if (baseUrl) {
  fetch(`${baseUrl}/api/recruitment/applications/${applicationId}/cv-analysis`, {
    method: "POST",
    headers: {
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    },
  }).catch((err) => console.error("[upload] cv-analysis trigger failed:", err));
} else {
  console.warn("[upload] NEXT_PUBLIC_APP_URL not set — cv-analysis not triggered");
}
```

- [ ] **Step 2: Verify .env.local has NEXT_PUBLIC_APP_URL (dev)**

Check `D:/Projects/Git Private/ck-ITBAAI/.env.local`. If not present, add:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**
```bash
git add src/app/api/recruitment/upload/route.ts .env.local
git commit -m "fix: use NEXT_PUBLIC_APP_URL for cv-analysis internal trigger to bypass proxy timeout"
```

---

## Task 2: Update onSuccess redirects to cv-analyze route

**Files:**
- Modify: `src/app/dashboard/hr-dashboard-client.tsx` (lines 130 and 202)
- Modify: `src/app/dashboard/recruitment/recruitment-client.tsx` (line 225)

- [ ] **Step 1: Update hr-dashboard-client.tsx — both onSuccess callbacks**

Find and replace all occurrences of:
```tsx
onSuccess={(id) => router.push(`/dashboard/recruitment/${id}`)}
```
With:
```tsx
onSuccess={(id) => router.push(`/dashboard/recruitment/${id}/cv-analyze`)}
```
(There are 2 occurrences in this file — replace both.)

- [ ] **Step 2: Update recruitment-client.tsx — onSuccess callback**

Find and replace:
```tsx
onSuccess={(id) => router.push(`/dashboard/recruitment/${id}`)}
```
With:
```tsx
onSuccess={(id) => router.push(`/dashboard/recruitment/${id}/cv-analyze`)}
```

- [ ] **Step 3: Commit**
```bash
git add src/app/dashboard/hr-dashboard-client.tsx src/app/dashboard/recruitment/recruitment-client.tsx
git commit -m "feat: redirect to dedicated cv-analyze page after CV upload"
```

---

## Task 3: Create cv-analyze server page

**Files:**
- Create: `src/app/dashboard/recruitment/[id]/cv-analyze/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNavbar from "@/components/ui/app-navbar";
import CvAnalyzeClient from "./cv-analyze-client";

export default async function CvAnalyzePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("name, email, role")
    .eq("auth_id", user.id)
    .single();

  const role = userData?.role ?? "viewer";

  return (
    <>
      <AppNavbar
        breadcrumbs={[
          { href: "/dashboard/recruitment", label: "Recruitment" },
          { href: `/dashboard/recruitment/${id}`, label: "Detail" },
          { label: "CV Analyze" },
        ]}
        user={userData ?? null}
      />
      <div className="pt-20 px-4 sm:px-6 max-w-[88rem] mx-auto">
        <CvAnalyzeClient id={id} userRole={role} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify AppNavbar accepts 3-level breadcrumbs**

Check `src/components/ui/app-navbar.tsx` — confirm `breadcrumbs` prop accepts an array and renders links for items with `href`. If it only supports 2 levels, adjust accordingly (just use `{ label: "CV Analyze" }` as last item without link).

- [ ] **Step 3: Commit**
```bash
git add src/app/dashboard/recruitment/[id]/cv-analyze/page.tsx
git commit -m "feat: add cv-analyze page with correct breadcrumb"
```

---

## Task 4: Create cv-analyze-client — polished scoring UI

**Files:**
- Create: `src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx`

This component reuses existing `ScoreCard` + `ScoreBreakdown` components but adds:
- Dedicated loading state with animated steps
- Stuck detection after 3 minutes
- Full scoring results without notes/history noise
- Link back to application detail

- [ ] **Step 1: Create cv-analyze-client.tsx**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Loader2, RefreshCw, AlertTriangle,
  Sparkles, AlertCircle, User, Briefcase, GraduationCap, Award, Globe,
  CheckCircle2, Clock,
} from "lucide-react";
import ScoreCard from "@/components/recruitment/score-card";
import ScoreBreakdown from "@/components/recruitment/score-breakdown";
import OverrideScoreDialog from "@/components/recruitment/override-score-dialog";
import StatusBadge from "@/components/crm/status-badge";
import { useApplicationRealtime } from "@/hooks/use-application-realtime";
import type { PipelineStatus } from "@/types/recruitment";

const PIPELINE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "#3B82F6" },
  SCREENED: { label: "Screened", color: "#8B5CF6" },
  SHORTLISTED: { label: "Shortlisted", color: "#7C8FFF" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "#F59E0B" },
  INTERVIEWED: { label: "Interviewed", color: "#F97316" },
  PASSED: { label: "Passed", color: "#22C55E" },
  FAILED: { label: "Failed", color: "#EF4444" },
  REJECTED: { label: "Rejected", color: "#6B7280" },
  OFFERED: { label: "Offered", color: "#06B6D4" },
  ACCEPTED: { label: "Accepted", color: "#10B981" },
  OFFER_REJECTED: { label: "Offer Rejected", color: "#EF4444" },
  ONBOARDED: { label: "Onboarded", color: "#22C55E" },
};

// Analysis loading steps for animated UX
const ANALYSIS_STEPS = [
  { label: "Tải file CV", durationMs: 3000 },
  { label: "Trích xuất nội dung", durationMs: 8000 },
  { label: "AI chấm điểm & đánh giá", durationMs: 60000 },
  { label: "Tổng hợp kết quả", durationMs: 5000 },
];

// How long before we show "stuck" warning
const STUCK_TIMEOUT_MS = 3 * 60 * 1000;

interface ApplicationData {
  application: {
    id: string;
    pipelineStatus: PipelineStatus;
    createdAt: string;
    createdBy: string | null;
  };
  person: {
    id: string;
    fullName: string;
    email: string;
    type: string | null;
    source: string | null;
  };
  jobDescription: { id: string; title: string; department: string | null } | null;
  cv: {
    id: string;
    parseStatus: string;
    originalFilename: string;
    mimeType: string;
    retryCount: number;
  } | null;
  screening: {
    id: string;
    aiScore: number | null;
    finalScore: number | null;
    skillMatchScore: number | null;
    experienceMatchScore: number | null;
    domainMatchScore: number | null;
    educationMatchScore: number | null;
    cultureFitScore: number | null;
    strengthsJson: string[] | null;
    weaknessesJson: string[] | null;
    summary: string | null;
    recommendation: string | null;
    keyHighlights: string[] | null;
    missingRequirements: string[] | null;
    parsedCvJson: Record<string, unknown> | null;
    isOverridden: boolean;
    overrideReason: string | null;
    overriddenAt: string | null;
    screenedAt: string;
  } | null;
  history: Array<{
    id: string;
    fromStatus: PipelineStatus | null;
    toStatus: PipelineStatus;
    changedBy: string | null;
    changedAt: string;
    note: string | null;
  }>;
}

interface Props {
  id: string;
  userRole: string;
}

const CAN_OVERRIDE = ["recruiter", "admin", "super_admin"];

function AnalysisLoadingCard({
  isStuck,
  onRetry,
  isRetrying,
}: {
  isStuck: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex >= ANALYSIS_STEPS.length - 1) return;
    const timer = setTimeout(
      () => setStepIndex((i) => Math.min(i + 1, ANALYSIS_STEPS.length - 1)),
      ANALYSIS_STEPS[stepIndex].durationMs,
    );
    return () => clearTimeout(timer);
  }, [stepIndex]);

  if (isStuck) {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
          <Clock className="w-6 h-6 text-[#F59E0B]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#C8D0E0]">Phân tích mất nhiều thời gian hơn dự kiến</p>
          <p className="text-xs text-[#5A6882] mt-1">AI đang xử lý CV phức tạp. Bạn có thể thử lại hoặc chờ thêm.</p>
        </div>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C8FFF]/15 hover:bg-[#7C8FFF]/25 text-[#7C8FFF] text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Đang thử lại..." : "Thử lại CV Analysis"}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#7C8FFF]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#7C8FFF] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#7C8FFF]" />
          </div>
        </div>
        <p className="text-base font-semibold text-[#ECF0F7]">AI đang chấm điểm CV...</p>
        <p className="text-xs text-[#5A6882] text-center max-w-xs">
          Quá trình này mất khoảng 30–90 giây. Trang sẽ tự cập nhật khi hoàn tất.
        </p>
      </div>

      {/* Step indicators */}
      <div className="w-full max-w-xs space-y-2">
        {ANALYSIS_STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                done ? "bg-[#22C55E]/20 border border-[#22C55E]/40" :
                active ? "bg-[#7C8FFF]/20 border border-[#7C8FFF]/40" :
                "bg-[#1E2840] border border-[#8B99B0]/10"
              }`}>
                {done ? (
                  <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
                ) : active ? (
                  <Loader2 className="w-3 h-3 text-[#7C8FFF] animate-spin" />
                ) : null}
              </div>
              <span className={`text-xs ${
                done ? "text-[#22C55E]" : active ? "text-[#ECF0F7]" : "text-[#5A6882]"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-[#222C4A] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-[#222C4A] rounded-xl" />
        <div className="h-48 bg-[#222C4A] rounded-xl" />
      </div>
    </div>
  );
}

export default function CvAnalyzeClient({ id, userRole }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStuck, setIsStuck] = useState(false);

  const realtime = useApplicationRealtime(id);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/recruitment/applications/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load application.");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAnalyzing =
    !data?.screening &&
    (data?.cv?.parseStatus === "PENDING" || data?.cv?.parseStatus === "PROCESSING");

  // Stuck detection: if still analyzing after STUCK_TIMEOUT_MS, show warning
  useEffect(() => {
    if (!isAnalyzing) { setIsStuck(false); return; }
    const timer = setTimeout(() => setIsStuck(true), STUCK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAnalyzing]);

  // Sync realtime updates
  useEffect(() => {
    if (!realtime.aiScore && !realtime.pipelineStatus) return;
    if (!data) return;
    // Realtime fired — re-fetch to get full screening data
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime.aiScore, realtime.pipelineStatus]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setIsStuck(false);
    try {
      const res = await fetch(`/api/recruitment/applications/${id}/cv-analysis`, { method: "POST" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Failed");
      }
      await fetchData();
    } catch {
      // silent fail — realtime/polling will update
    } finally {
      setIsRetrying(false);
    }
  }, [id, fetchData]);

  const handleCvPreview = async () => {
    if (!data?.cv?.id) return;
    setCvLoading(true);
    try {
      const res = await fetch(`/api/recruitment/cv/${data.cv.id}`);
      if (res.ok) {
        const { signedUrl } = await res.json();
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setCvLoading(false);
    }
  };

  const handleOverrideSuccess = (finalScore: number) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        screening: prev.screening
          ? { ...prev.screening, finalScore, isOverridden: true, overriddenAt: new Date().toISOString() }
          : prev.screening,
      };
    });
  };

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-[#EF4444] text-sm">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-[#7C8FFF]/15 text-[#7C8FFF] text-sm hover:bg-[#7C8FFF]/25 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { application, person, screening, cv, jobDescription } = data;
  const pipelineStatus = realtime.pipelineStatus ?? application.pipelineStatus;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840] transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-[#ECF0F7] truncate">{person.fullName}</h1>
            <p className="text-sm text-[#5A6882] truncate">{person.email}</p>
            {jobDescription && (
              <p className="text-xs text-[#8B99B0] mt-0.5 truncate">
                {jobDescription.title}{jobDescription.department ? ` · ${jobDescription.department}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={pipelineStatus} config={PIPELINE_STATUS_CONFIG} />
          {cv && (
            <button
              onClick={handleCvPreview}
              disabled={cvLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#222C4A] border border-[#8B99B0]/10 text-[#8B99B0] hover:text-[#ECF0F7] hover:border-[#8B99B0]/30 transition-colors disabled:opacity-50"
            >
              {cvLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              {cv.originalFilename ?? "Xem CV"}
            </button>
          )}
          {CAN_OVERRIDE.includes(userRole) && screening && (
            <OverrideScoreDialog
              applicationId={id}
              currentFinalScore={screening.finalScore}
              onSuccess={handleOverrideSuccess}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      {screening ? (
        <>
          {/* Score + Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreCard
              aiScore={screening.aiScore}
              finalScore={screening.finalScore}
              isOverridden={screening.isOverridden}
              overriddenAt={screening.overriddenAt ?? undefined}
              recommendation={screening.recommendation}
              summary={screening.summary}
            />
            <ScoreBreakdown
              skillMatch={screening.skillMatchScore}
              experienceMatch={screening.experienceMatchScore}
              domainMatch={screening.domainMatchScore}
              educationMatch={screening.educationMatchScore}
              cultureFit={screening.cultureFitScore}
            />
          </div>

          {/* Highlights + Missing */}
          {((screening.keyHighlights?.length ?? 0) > 0 || (screening.missingRequirements?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(screening.keyHighlights?.length ?? 0) > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">Điểm nổi bật</h3>
                  </div>
                  <ul className="space-y-2">
                    {(screening.keyHighlights ?? []).map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#ECF0F7]">
                        <span className="w-5 h-5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-[#F59E0B]">{i + 1}</span>
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(screening.missingRequirements?.length ?? 0) > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-[#F97316]" />
                    <h3 className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">Yêu cầu còn thiếu</h3>
                  </div>
                  <ul className="space-y-2">
                    {(screening.missingRequirements ?? []).map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#ECF0F7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] mt-2 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Strengths + Weaknesses */}
          {((screening.strengthsJson?.length ?? 0) > 0 || (screening.weaknessesJson?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                    <span className="text-xs text-[#22C55E]">✓</span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">Điểm mạnh</h3>
                </div>
                <ul className="space-y-2">
                  {(screening.strengthsJson ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#ECF0F7] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-2 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
                    <span className="text-xs text-[#EF4444]">✗</span>
                  </div>
                  <h3 className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider">Điểm yếu</h3>
                </div>
                <ul className="space-y-2">
                  {(screening.weaknessesJson ?? []).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#ECF0F7] leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mt-2 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Parsed CV Info */}
          {screening.parsedCvJson && Object.keys(screening.parsedCvJson).length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#ECF0F7] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#7C8FFF]" />
                Thông tin trích xuất từ CV
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Boolean(screening.parsedCvJson.current_title) && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-[#8B99B0] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#5A6882]">Vị trí hiện tại</p>
                      <p className="text-sm text-[#ECF0F7]">{String(screening.parsedCvJson.current_title)}</p>
                    </div>
                  </div>
                )}
                {Boolean(screening.parsedCvJson.current_company) && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-[#8B99B0] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#5A6882]">Công ty</p>
                      <p className="text-sm text-[#ECF0F7]">{String(screening.parsedCvJson.current_company)}</p>
                    </div>
                  </div>
                )}
                {screening.parsedCvJson.total_years_experience != null && (
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-[#8B99B0] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#5A6882]">Kinh nghiệm</p>
                      <p className="text-sm text-[#ECF0F7]">{String(screening.parsedCvJson.total_years_experience)} năm</p>
                    </div>
                  </div>
                )}
                {Boolean(screening.parsedCvJson.location) && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-[#8B99B0] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#5A6882]">Địa điểm</p>
                      <p className="text-sm text-[#ECF0F7]">{String(screening.parsedCvJson.location)}</p>
                    </div>
                  </div>
                )}
              </div>
              {Array.isArray(screening.parsedCvJson.skills) && screening.parsedCvJson.skills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#8B99B0]/10">
                  <p className="text-xs text-[#5A6882] mb-2">Kỹ năng</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(screening.parsedCvJson.skills as string[]).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#7C8FFF]/10 border border-[#7C8FFF]/20 text-[#7C8FFF] text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(screening.parsedCvJson.education) && screening.parsedCvJson.education.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#8B99B0]/10">
                  <p className="text-xs text-[#5A6882] mb-2 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Học vấn
                  </p>
                  <div className="space-y-1.5">
                    {(screening.parsedCvJson.education as Array<Record<string, string>>).map((edu, i) => (
                      <p key={i} className="text-sm text-[#C8D0E0]">
                        {edu.degree}{edu.field ? ` - ${edu.field}` : ""}{edu.school ? ` tại ${edu.school}` : ""}{edu.year ? ` (${edu.year})` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : cv?.parseStatus === "FAILED" ? (
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#C8D0E0]">CV Analysis thất bại</p>
            <p className="text-xs text-[#5A6882] mt-1">Có lỗi xảy ra khi AI xử lý CV. Bạn có thể thử lại.</p>
          </div>
          <button onClick={handleRetry} disabled={isRetrying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C8FFF]/15 hover:bg-[#7C8FFF]/25 text-[#7C8FFF] text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Đang thử lại..." : "Thử lại CV Analysis"}
          </button>
        </div>
      ) : (isAnalyzing) ? (
        <AnalysisLoadingCard isStuck={isStuck} onRetry={handleRetry} isRetrying={isRetrying} />
      ) : (
        <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-[#5A6882]">Chưa có kết quả sàng lọc.</p>
          {!jobDescription && (
            <p className="text-xs text-[#F59E0B]">⚠ Cần gán Job Description trước khi chạy CV Analysis.</p>
          )}
          {["hr", "interviewer", "admin", "super_admin"].includes(userRole) && (
            <button onClick={handleRetry} disabled={isRetrying || !jobDescription}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C8FFF]/15 hover:bg-[#7C8FFF]/25 text-[#7C8FFF] text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Đang xử lý..." : "Bắt đầu CV Analysis"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Check file line count stays reasonable**

Run:
```bash
wc -l "src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx"
```
Expected: under 300 lines. If over, extract `AnalysisLoadingCard` to a separate file.

- [ ] **Step 3: Commit**
```bash
git add src/app/dashboard/recruitment/[id]/cv-analyze/
git commit -m "feat: add dedicated cv-analyze page with polished scoring UI and stuck detection"
```

---

## Task 5: TypeScript compile check

- [ ] **Step 1: Run TypeScript check**
```bash
cd "D:/Projects/Git Private/ck-ITBAAI" && npx tsc --noEmit 2>&1 | head -50
```
Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 2: Run build check**
```bash
npm run build 2>&1 | tail -30
```
Expected: clean build.

- [ ] **Step 3: Commit any fixes**
```bash
git add -A
git commit -m "fix: resolve TypeScript errors in cv-analyze implementation"
```

---

## Self-Review Checklist

- [x] Bug fix (Task 1): internal fetch URL uses env var / localhost → bypasses Cloudflare proxy
- [x] Redirect (Task 2): all 3 onSuccess callbacks updated
- [x] New page (Task 3): server component with auth + correct breadcrumb "CV Analyze"
- [x] Client component (Task 4): handles loading, stuck (3min), results, failed states
- [x] Reuses existing ScoreCard + ScoreBreakdown components (DRY)
- [x] No notes/history on cv-analyze page (focused scoring view)
- [x] Polling/realtime via existing `useApplicationRealtime` hook (no duplication)
- [x] TypeScript types match existing `ApplicationData` interface (copied from detail client)

**Known gap**: The existing `application-detail-client.tsx` still has the old loading state. After this plan, when a user navigates to `/dashboard/recruitment/[id]` directly, they still see the mixed view. This is intentional — the detail page is for "full overview + notes + history", cv-analyze is for "scoring results focus". Both routes serve different purposes.

"use client";
import { alpha } from "@/lib/utils";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle, FileText, Settings, BarChart3, Upload, Download, RotateCcw, Search, Eye, MoreVertical, Users } from "lucide-react";
import DataTable from "@/components/crm/data-table";
import KanbanBoard from "@/components/crm/kanban-board";
import BulkActionBar from "@/components/crm/bulk-action-bar";
import CvUploadDialog from "@/components/recruitment/cv-upload-dialog";
import { Button } from "@/components/ui/button";
import ViewSwitcher from "@/components/crm/view-switcher";
import { SharedDashboardPageHeader } from "@/components/shares";
import type { ColumnDef } from "@/lib/crm/types";
import type { PipelineStatus } from "@/types/recruitment";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApplicationRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jdTitle: string;
  jdId: string;
  jdDepartment: string;
  pipelineStatus: PipelineStatus;
  aiScore: number | null;
  cvParseStatus: string | null;
  createdAt: string;
}

interface ApiApplication {
  id: string;
  pipelineStatus: PipelineStatus;
  createdAt: string;
  person: { id: string; fullName: string; email: string } | null;
  jobDescription: { id: string; title: string; department: string | null } | null;
  cv: { id: string; parseStatus: string; originalFilename: string } | null;
  screening: { id: string; finalScore: number | null; aiScore: number | null; isOverridden: boolean } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-primary/15 text-primary",
  SCREENED: "bg-ai/15 text-ai",
  SHORTLISTED: "bg-primary/15 text-primary",
  INTERVIEW_SCHEDULED: "bg-warning/15 text-warning",
  INTERVIEWED: "bg-warning/15 text-warning",
  PASSED: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
  REJECTED: "bg-muted-foreground/15 text-muted-foreground",
  OFFERED: "bg-primary/15 text-primary",
  ACCEPTED: "bg-success/20 text-success",
  OFFER_REJECTED: "bg-danger/15 text-danger",
  ONBOARDED: "bg-success/25 text-success",
};

const STATUS_DOT: Record<string, string> = {
  NEW: "var(--primary)", SCREENED: "var(--ai)", SHORTLISTED: "var(--primary)",
  INTERVIEW_SCHEDULED: "var(--warning)", INTERVIEWED: "var(--warning)",
  PASSED: "var(--success)", FAILED: "var(--danger)", REJECTED: "var(--muted-foreground)",
  OFFERED: "var(--primary)", ACCEPTED: "var(--success)", OFFER_REJECTED: "var(--danger)", ONBOARDED: "var(--success)",
};

const STATUS_ROW_CLASS: Record<string, string> = {
  NEW: "border-l-2 border-l-primary",
  SCREENED: "border-l-2 border-l-ai",
  SHORTLISTED: "border-l-2 border-l-primary",
  INTERVIEW_SCHEDULED: "border-l-2 border-l-warning",
  INTERVIEWED: "border-l-2 border-l-warning",
  PASSED: "border-l-2 border-l-success",
  FAILED: "border-l-2 border-l-danger",
  REJECTED: "border-l-2 border-l-muted-foreground",
  OFFERED: "border-l-2 border-l-primary",
  ACCEPTED: "border-l-2 border-l-success",
  OFFER_REJECTED: "border-l-2 border-l-danger",
  ONBOARDED: "border-l-2 border-l-success",
};

const KANBAN_STATUSES: PipelineStatus[] = [
  "NEW", "SCREENED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "PASSED",
];

const KANBAN_COLORS: Record<string, string> = {
  NEW: "var(--primary)", SCREENED: "var(--ai)", SHORTLISTED: "var(--primary)",
  INTERVIEW_SCHEDULED: "var(--warning)", INTERVIEWED: "var(--warning)", PASSED: "var(--success)",
};

const FUNNEL = ["NEW", "SCREENED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "PASSED", "OFFERED", "ONBOARDED"];
const FUNNEL_LABEL: Record<string, string> = {
  NEW: "Mới", SCREENED: "Sàng lọc", SHORTLISTED: "Tiềm năng", INTERVIEW_SCHEDULED: "Hẹn PV",
  INTERVIEWED: "Đã PV", PASSED: "Đạt PV", OFFERED: "Đề xuất", ONBOARDED: "Onboard",
};
const EXITS: [string, string][] = [["REJECTED", "Từ chối"], ["FAILED", "Trượt PV"]];

const CV_STATUS_OPTIONS = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getScoreTone(score: number | null) {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-danger";
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const COLUMNS: ColumnDef<ApplicationRow>[] = [
  {
    key: "candidateName",
    label: "Candidate",
    sortable: true,
    render: (val, row) => {
      const name = String(val ?? "");
      const initials = name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase() || "?";
      const hue = (name.charCodeAt(0) ?? 0) * 37 % 360;
      return (
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-foreground"
            style={{ background: `hsl(${hue}deg 50% 38%)`, border: `1px solid hsl(${hue}deg 50% 55% / 0.25)` }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{name}</div>
            <div className="truncate text-xs text-muted-foreground mt-0.5">{row.candidateEmail}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: "jdTitle",
    label: "JD Title",
    sortable: true,
    render: (val) => <span className="text-muted-foreground text-sm">{String(val ?? "—")}</span>,
  },
  {
    key: "pipelineStatus",
    label: "Pipeline Status",
    render: (val) => {
      const status = String(val ?? "");
      const color = STATUS_DOT[status] ?? "var(--muted-foreground)";
      return (
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${alpha(color, 50)}` }} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}>
            {status.replace(/_/g, " ")}
          </span>
        </div>
      );
    },
  },
  {
    key: "aiScore",
    label: "AI Score",
    sortable: true,
    render: (val) => {
      if (val == null) return <span className="text-muted-foreground text-sm">—</span>;
      const score = Number(val);
      const tone = score >= 70 ? { text: "text-success", bar: "var(--success)" }
        : score >= 50 ? { text: "text-warning", bar: "var(--warning)" }
        : { text: "text-danger", bar: "var(--danger)" };
      return (
        <div className="flex flex-col gap-1.5 min-w-[52px]">
          <span className={`font-mono font-bold text-sm tabular-nums ${tone.text}`}>{score.toFixed(1)}</span>
          <div className="h-[3px] w-14 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full opacity-80 transition-all duration-500"
              style={{ width: `${Math.min(100, score)}%`, background: tone.bar }} />
          </div>
        </div>
      );
    },
  },
  {
    key: "cvParseStatus",
    label: "CV Status",
    render: (val) => {
      const status = String(val ?? "");
      const map: Record<string, { dot: string; text: string; label: string }> = {
        COMPLETED: { dot: "var(--success)", text: "text-success", label: "Completed" },
        PROCESSING: { dot: "var(--warning)", text: "text-warning", label: "Processing" },
        FAILED:     { dot: "var(--danger)", text: "text-danger", label: "Failed" },
        PENDING:    { dot: "var(--muted-foreground)", text: "text-muted-foreground", label: "Pending" },
      };
      const m = map[status];
      if (!m) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.dot, boxShadow: status !== "PENDING" ? `0 0 4px ${alpha(m.dot, 50)}` : undefined }} />
          <span className={`text-xs font-medium ${m.text}`}>{m.label}</span>
        </div>
      );
    },
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    render: (val) => (
      <span className="text-muted-foreground text-xs">
        {val ? new Date(String(val)).toLocaleDateString("vi-VN") : "—"}
      </span>
    ),
  },
  {
    key: "id",
    label: "",
    render: (_v, row) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/recruitment/${row.id}`; }}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          aria-label="Xem chi tiết"
        >
          <Eye size={13} />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
          aria-label="Tùy chọn khác"
        >
          <MoreVertical size={13} />
        </button>
      </div>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { userRole: string }

export default function RecruitmentClient({ userRole }: Props) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "card" | "kanban">("table");
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [jdFilter, setJdFilter] = useState("");
  const [cvStatusFilter, setCvStatusFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc" | "score_desc" | "score_asc">("date_desc");
  const [skillFilter, setSkillFilter] = useState("");
  const [jobDescriptions, setJobDescriptions] = useState<{ id: string; title: string }[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [exporting, setExporting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "50" });
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (jdFilter) params.set("jdId", jdFilter);
      if (skillFilter) params.set("skillId", skillFilter);
      if (cvStatusFilter) params.set("cvStatus", cvStatusFilter);
      if (minScore) params.set("minScore", minScore);
      if (maxScore) params.set("maxScore", maxScore);
      if (createdFrom) params.set("createdFrom", createdFrom);
      if (createdTo) params.set("createdTo", createdTo);

      const res = await fetch(`/api/recruitment/applications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();
      let rows: ApplicationRow[] = (json.applications ?? []).map((a: ApiApplication) => ({
        id: a.id,
        candidateName: a.person?.fullName ?? "Unknown",
        candidateEmail: a.person?.email ?? "",
        jdTitle: a.jobDescription?.title ?? "—",
        jdId: a.jobDescription?.id ?? "",
        jdDepartment: a.jobDescription?.department ?? "",
        pipelineStatus: a.pipelineStatus,
        aiScore: a.screening?.finalScore ?? a.screening?.aiScore ?? null,
        cvParseStatus: a.cv?.parseStatus ?? null,
        createdAt: a.createdAt,
      }));

      if (sortBy === "score_desc") {
        rows = rows.sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
      } else if (sortBy === "score_asc") {
        rows = rows.sort((a, b) => (a.aiScore ?? 101) - (b.aiScore ?? 101));
      }

      setApplications(rows);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error("[RecruitmentClient] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, jdFilter, skillFilter, cvStatusFilter, minScore, maxScore, createdFrom, createdTo, sortBy]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchApplications, search]);

  useEffect(() => {
    async function fetchJDs() {
      try {
        const res = await fetch("/api/recruitment/job-descriptions");
        if (!res.ok) return;
        const payload = await res.json();
        setJobDescriptions((payload.jobDescriptions ?? payload.data ?? []).map(
          (jd: { id: string; title: string }) => ({ id: jd.id, title: jd.title })
        ));
      } catch (err) {
        console.error("[RecruitmentClient] JD fetch:", err);
      }
    }
    fetchJDs();
  }, []);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("/api/recruitment/skills");
        if (!res.ok) return;
        const payload = await res.json();
        setSkills((payload.skills ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
      } catch (err) {
        console.error("[RecruitmentClient] skills fetch:", err);
      }
    }
    fetchSkills();
  }, []);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/recruitment/applications/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      setSelectedIds(new Set());
      fetchApplications();
    } catch (err) {
      console.error("[RecruitmentClient] bulk reject:", err);
    }
  }, [selectedIds, fetchApplications]);

  async function handleExportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (jdFilter) params.set("jdId", jdFilter);
      if (skillFilter) params.set("skillId", skillFilter);
      if (cvStatusFilter) params.set("cvStatus", cvStatusFilter);
      if (minScore) params.set("minScore", minScore);
      if (maxScore) params.set("maxScore", maxScore);
      if (createdFrom) params.set("createdFrom", createdFrom);
      if (createdTo) params.set("createdTo", createdTo);

      const res = await fetch(`/api/recruitment/applications/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recruitment-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[RecruitmentClient] export:", err);
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSearch(""); setStatusFilter(""); setJdFilter(""); setSkillFilter("");
    setCvStatusFilter(""); setMinScore(""); setMaxScore("");
    setCreatedFrom(""); setCreatedTo(""); setSortBy("date_desc");
  }

  const statusCounts = applications.reduce<Record<string, number>>((acc, item) => {
    acc[item.pipelineStatus] = (acc[item.pipelineStatus] ?? 0) + 1;
    return acc;
  }, {});

  const activeFilterCount = [statusFilter, jdFilter, skillFilter, cvStatusFilter, minScore, maxScore, createdFrom, createdTo].filter(Boolean).length + (sortBy !== "date_desc" ? 1 : 0);

  const kanbanColumns = KANBAN_STATUSES.map(status => ({
    key: status,
    label: status.replace(/_/g, " "),
    color: KANBAN_COLORS[status] ?? "var(--muted-foreground)",
    items: applications.filter(a => a.pipelineStatus === status),
  }));

  const isHR = userRole === "hr" || userRole === "admin" || userRole === "super_admin";
  const isInterviewer = userRole === "interviewer" || userRole === "admin" || userRole === "super_admin";
  const isRecruiter = userRole === "recruiter" || userRole === "admin" || userRole === "super_admin";
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return (
    <div className="space-y-5 pb-20">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        <SharedDashboardPageHeader
          className="mb-0"
          title="Tuyển dụng"
          icon={Users}
          badge={{ label: `${total} hồ sơ` }}
          description="Toàn bộ ứng viên và trạng thái của họ trong quy trình"
        />

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHR && (
            <CvUploadDialog
              onSuccess={(id) => router.push(`/dashboard/recruitment/${id}`)}
              trigger={
                <Button className="h-9 gap-1.5 rounded-lg border-0 bg-primary px-4 text-[11px] font-semibold text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all hover:bg-accent hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--primary)_35%,transparent)] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Tải lên CV
                </Button>
              }
            />
          )}

          {(isHR || isInterviewer) && (
            <button type="button" onClick={handleExportCsv} disabled={exporting}
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-muted px-3.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-success/30 hover:text-success hover:bg-accent disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}

          {isRecruiter && (
            <Link href="/dashboard/recruitment/dashboard"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-muted px-3.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-ai/30 hover:text-ai hover:bg-accent">
              <BarChart3 className="h-3.5 w-3.5" /> Báo cáo
            </Link>
          )}

          {isInterviewer && (
            <Link href="/dashboard/recruitment/jd"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-muted px-3.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-success/30 hover:text-success hover:bg-accent">
              <FileText className="h-3.5 w-3.5" /> JDs
            </Link>
          )}

          {isAdmin && (
            <Link href="/dashboard/recruitment/settings"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-muted px-3.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-warning/30 hover:text-warning hover:bg-accent">
              <Settings className="h-3.5 w-3.5" /> Cài đặt
            </Link>
          )}

          <div className="ml-auto">
            <ViewSwitcher value={view} onChange={setView} views={["table", "kanban"]} />
          </div>
        </div>
      </div>

      {/* ── FILTER SECTION ──────────────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-20 space-y-2 bg-background pb-2">

        {/* Funnel: luồng chính dạng chevron + hai nhánh loại; bấm để lọc. Số đếm theo trang đang tải. */}
        <div className="flex items-stretch gap-3">
          <button type="button" onClick={() => setStatusFilter("")} aria-pressed={statusFilter === ""}
            className={`shrink-0 rounded-xl border px-4 py-2 text-left transition-colors cursor-pointer ${statusFilter === "" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
            <span className="block text-xl font-black leading-none tabular-nums">{total}</span>
            <span className={`block mt-1 text-[11px] font-bold ${statusFilter === "" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Tất cả</span>
          </button>
          <div className="flex flex-1 min-w-0 rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--card))] p-1">
            {FUNNEL.map((st, i) => {
              const on = statusFilter === st;
              const n = statusCounts[st] ?? 0;
              return (
                <button key={st} type="button" onClick={() => setStatusFilter(on ? "" : st)} aria-pressed={on}
                  className={`relative flex-1 min-w-0 py-2 text-left transition-colors cursor-pointer ${i ? "-ml-1 pl-6" : "pl-4 rounded-l-lg"} pr-4 ${on ? "bg-primary text-primary-foreground z-10" : n ? "bg-card hover:bg-accent" : "bg-card/60 hover:bg-card"}`}
                  style={{ clipPath: i === FUNNEL.length - 1 ? "polygon(0 0,100% 0,100% 100%,0 100%,10px 50%)" : i ? "polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%,10px 50%)" : "polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)" }}>
                  <span className="block text-xl font-black leading-none tabular-nums">{n}</span>
                  <span className={`block mt-1 truncate text-[11px] font-bold ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{FUNNEL_LABEL[st]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 gap-2">
            {EXITS.map(([st, label]) => {
              const on = statusFilter === st;
              return (
                <button key={st} type="button" onClick={() => setStatusFilter(on ? "" : st)} aria-pressed={on}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${on ? "border-danger bg-danger/10" : "border-dashed border-border bg-card hover:border-danger/40"}`}>
                  <span className="block text-xl font-black leading-none tabular-nums text-foreground">{statusCounts[st] ?? 0}</span>
                  <span className="block mt-1 text-[11px] font-bold text-muted-foreground">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--primary)_10%,transparent)] bg-background/90 px-3 py-2 backdrop-blur-2xl">
          <div className="relative flex-[2] min-w-[160px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Tìm ứng viên, email, vị trí..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-transparent bg-white/[0.03] pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/30 focus:bg-white/[0.05]" />
          </div>
          <select value={jdFilter} onChange={(e) => setJdFilter(e.target.value)}
            className="h-8 min-w-[110px] flex-1 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none transition-colors focus:border-primary/30 cursor-pointer">
            <option value="">Tất cả JD</option>
            {jobDescriptions.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
          </select>
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}
            className="h-8 min-w-[110px] flex-1 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none transition-colors focus:border-primary/30 cursor-pointer">
            <option value="">Tất cả skill</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={cvStatusFilter} onChange={(e) => setCvStatusFilter(e.target.value)}
            className="h-8 w-28 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none transition-colors focus:border-primary/30 cursor-pointer">
            <option value="">CV status</option>
            {CV_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={minScore} onChange={(e) => setMinScore(e.target.value)} type="number" min="0" max="100" placeholder="Min score"
            className="h-8 w-20 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/30" />
          <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} type="number" min="0" max="100" placeholder="Max score"
            className="h-8 w-20 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-primary/30" />
          <input value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} type="date"
            className="h-8 w-32 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none scheme-dark transition-colors focus:border-primary/30" />
          <input value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} type="date"
            className="h-8 w-32 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none scheme-dark transition-colors focus:border-primary/30" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-8 w-36 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-muted-foreground outline-none transition-colors focus:border-primary/30 cursor-pointer">
            <option value="date_desc">Ngày (mới nhất)</option>
            <option value="score_desc">Điểm (cao → thấp)</option>
            <option value="score_asc">Điểm (thấp → cao)</option>
          </select>
          <button type="button" onClick={resetFilters} aria-label="Reset filters"
            className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border transition-all ${
              activeFilterCount > 0
                ? "border-primary/35 bg-primary/10 text-primary"
                : "border-transparent bg-white/[0.03] text-muted-foreground hover:text-muted-foreground"
            }`}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      {view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--primary)_10%,transparent)] bg-muted">
          <div className="h-px w-full bg-gradient-to-r from-primary/50 via-success/20 to-transparent" />
          <DataTable
            columns={COLUMNS}
            data={applications}
            loading={loading}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onRowClick={(row) => router.push(`/dashboard/recruitment/${row.id}`)}
            emptyMessage="Chưa có ứng viên nào"
            rowClassName={(row) => STATUS_ROW_CLASS[row.pipelineStatus] ?? ""}
          />
        </div>
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={(item) => (
            <div
              onClick={() => router.push(`/dashboard/recruitment/${item.id}`)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--primary)_12%,transparent)] bg-muted p-4 transition-all hover:border-primary/30 hover:bg-accent"
            >
              {/* Top shimmer on hover */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-ai opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{item.candidateName}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.jdTitle !== "—" ? item.jdTitle : "Chưa có JD"}
                  </div>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-semibold ${STATUS_COLORS[item.pipelineStatus] ?? "bg-muted text-muted-foreground"}`}>
                  {item.pipelineStatus.replace(/_/g, " ")}
                </span>
              </div>

              {item.aiScore != null && (
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">AI Score</span>
                    <span className={`font-mono text-[11px] font-bold ${getScoreTone(item.aiScore)}`}>
                      {item.aiScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, item.aiScore))}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--primary)_8%,transparent)] pt-2.5 text-[10px] text-muted-foreground">
                <span>{item.cvParseStatus ?? "PENDING"}</span>
                <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          )}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        actions={[{ label: "Reject Selected", icon: XCircle, onClick: handleBulkReject, variant: "destructive" }]}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}

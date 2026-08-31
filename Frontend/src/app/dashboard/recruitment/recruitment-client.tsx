"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  XCircle, FileText, Settings, BarChart3, Upload, Download,
  RotateCcw, Search, Eye, MoreVertical, Users, CalendarClock,
} from "lucide-react";
import DataTable from "@/components/crm/data-table";
import KanbanBoard from "@/components/crm/kanban-board";
import BulkActionBar from "@/components/crm/bulk-action-bar";
import CvUploadDialog from "@/components/recruitment/cv-upload-dialog";
import { Button } from "@/components/ui/button";
import ViewSwitcher from "@/components/crm/view-switcher";
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
  NEW: "bg-[#3B82F6]/15 text-[#3B82F6]",
  SCREENED: "bg-[#8B5CF6]/15 text-[#8B5CF6]",
  SHORTLISTED: "bg-[#7C8FFF]/15 text-[#7C8FFF]",
  INTERVIEW_SCHEDULED: "bg-[#FFB547]/15 text-[#FFB547]",
  INTERVIEWED: "bg-[#F97316]/15 text-[#F97316]",
  PASSED: "bg-[#36DDAB]/15 text-[#36DDAB]",
  FAILED: "bg-[#FF6B82]/15 text-[#FF6B82]",
  REJECTED: "bg-[#6B7280]/15 text-[#6B7280]",
  OFFERED: "bg-[#06B6D4]/15 text-[#06B6D4]",
  ACCEPTED: "bg-[#36DDAB]/20 text-[#36DDAB]",
  OFFER_REJECTED: "bg-[#FF6B82]/15 text-[#FF6B82]",
  ONBOARDED: "bg-[#36DDAB]/25 text-[#36DDAB]",
};

const STATUS_DOT: Record<string, string> = {
  NEW: "#3B82F6", SCREENED: "#8B5CF6", SHORTLISTED: "#7C8FFF",
  INTERVIEW_SCHEDULED: "#FFB547", INTERVIEWED: "#F97316",
  PASSED: "#36DDAB", FAILED: "#FF6B82", REJECTED: "#6B7280",
  OFFERED: "#06B6D4", ACCEPTED: "#36DDAB", OFFER_REJECTED: "#FF6B82", ONBOARDED: "#36DDAB",
};

const STATUS_ROW_CLASS: Record<string, string> = {
  NEW: "border-l-2 border-l-[#3B82F6]",
  SCREENED: "border-l-2 border-l-[#8B5CF6]",
  SHORTLISTED: "border-l-2 border-l-[#7C8FFF]",
  INTERVIEW_SCHEDULED: "border-l-2 border-l-[#FFB547]",
  INTERVIEWED: "border-l-2 border-l-[#F97316]",
  PASSED: "border-l-2 border-l-[#36DDAB]",
  FAILED: "border-l-2 border-l-[#FF6B82]",
  REJECTED: "border-l-2 border-l-[#6B7280]",
  OFFERED: "border-l-2 border-l-[#06B6D4]",
  ACCEPTED: "border-l-2 border-l-[#36DDAB]",
  OFFER_REJECTED: "border-l-2 border-l-[#FF6B82]",
  ONBOARDED: "border-l-2 border-l-[#36DDAB]",
};

const KANBAN_STATUSES: PipelineStatus[] = [
  "NEW", "SCREENED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "PASSED",
];

const KANBAN_COLORS: Record<string, string> = {
  NEW: "#3B82F6", SCREENED: "#8B5CF6", SHORTLISTED: "#7C8FFF",
  INTERVIEW_SCHEDULED: "#FFB547", INTERVIEWED: "#F97316", PASSED: "#36DDAB",
};

const CV_STATUS_OPTIONS = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];

const FILTER_TABS = [
  { key: "", label: "Tất cả", dot: "#7C8FFF" },
  { key: "NEW", label: "Mới", dot: "#3B82F6" },
  { key: "SCREENED", label: "Sàng lọc", dot: "#8B5CF6" },
  { key: "REJECTED", label: "Từ chối", dot: "#6B7280" },
  { key: "SHORTLISTED", label: "Tiềm năng", dot: "#7C8FFF" },
  { key: "INTERVIEW_SCHEDULED", label: "Hẹn PV", dot: "#FFB547" },
  { key: "INTERVIEWED", label: "Đã PV", dot: "#F97316" },
  { key: "PASSED", label: "Đạt PV", dot: "#36DDAB" },
  { key: "FAILED", label: "Trượt PV", dot: "#FF6B82" },
  { key: "OFFERED", label: "Đề xuất", dot: "#06B6D4" },
  { key: "ONBOARDED", label: "Onboard", dot: "#36DDAB" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getScoreTone(score: number | null) {
  if (score == null) return "text-[#5A6882]";
  if (score >= 70) return "text-[#36DDAB]";
  if (score >= 50) return "text-[#FFB547]";
  return "text-[#FF6B82]";
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white"
            style={{ background: `hsl(${hue}deg 50% 38%)`, border: `1px solid hsl(${hue}deg 50% 55% / 0.25)` }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#ECF0F7]">{name}</div>
            <div className="truncate text-xs text-[#3D4F6B] mt-0.5">{row.candidateEmail}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: "jdTitle",
    label: "JD Title",
    sortable: true,
    render: (val) => <span className="text-[#8B99B0] text-sm">{String(val ?? "—")}</span>,
  },
  {
    key: "pipelineStatus",
    label: "Pipeline Status",
    render: (val) => {
      const status = String(val ?? "");
      const color = STATUS_DOT[status] ?? "#8B99B0";
      return (
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}80` }} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[status] ?? "bg-white/5 text-[#8B99B0]"}`}>
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
      if (val == null) return <span className="text-[#3D4F6B] text-sm">—</span>;
      const score = Number(val);
      const tone = score >= 70 ? { text: "text-[#36DDAB]", bar: "#36DDAB" }
        : score >= 50 ? { text: "text-[#FFB547]", bar: "#FFB547" }
        : { text: "text-[#FF6B82]", bar: "#FF6B82" };
      return (
        <div className="flex flex-col gap-1.5 min-w-[52px]">
          <span className={`font-mono font-bold text-sm tabular-nums ${tone.text}`}>{score.toFixed(1)}</span>
          <div className="h-[3px] w-14 rounded-full bg-white/8 overflow-hidden">
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
        COMPLETED: { dot: "#36DDAB", text: "text-[#36DDAB]", label: "Completed" },
        PROCESSING: { dot: "#FFB547", text: "text-[#FFB547]", label: "Processing" },
        FAILED:     { dot: "#FF6B82", text: "text-[#FF6B82]", label: "Failed" },
        PENDING:    { dot: "#3D4F6B", text: "text-[#5A6882]", label: "Pending" },
      };
      const m = map[status];
      if (!m) return <span className="text-[#3D4F6B] text-xs">—</span>;
      return (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.dot, boxShadow: status !== "PENDING" ? `0 0 4px ${m.dot}80` : undefined }} />
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
      <span className="text-[#5A6882] text-xs">
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
          className="p-1.5 rounded-lg hover:bg-[#222C4A] text-[#5A6882] hover:text-[#7C8FFF] transition-colors cursor-pointer"
          aria-label="Xem chi tiết"
        >
          <Eye size={13} />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-[#222C4A] text-[#5A6882] hover:text-[#8B99B0] transition-colors cursor-pointer"
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
  const completedCv = applications.filter(a => a.cvParseStatus === "COMPLETED").length;
  const pendingInterviews = applications.filter(
    a => a.pipelineStatus === "SHORTLISTED" || a.pipelineStatus === "INTERVIEW_SCHEDULED"
  ).length;
  const activeFilterCount = [statusFilter, jdFilter, skillFilter, cvStatusFilter, minScore, maxScore, createdFrom, createdTo].filter(Boolean).length + (sortBy !== "date_desc" ? 1 : 0);

  const kanbanColumns = KANBAN_STATUSES.map(status => ({
    key: status,
    label: status.replace(/_/g, " "),
    color: KANBAN_COLORS[status] ?? "#8B99B0",
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

        {/* Title + metric cards */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5A6882]">HR Pipeline</p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#ECF0F7]">Recruitment</h1>
          </div>

          {/* Metric chips */}
          <div className="hidden lg:flex items-stretch gap-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(91,108,240,0.18)] text-[#7C8FFF]">
                <Users size={14} />
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#5A6882]">Ứng viên</div>
                <div className="text-xl font-bold leading-none text-[#ECF0F7]">{total}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(54,221,171,0.12)] text-[#36DDAB]">
                <FileText size={14} />
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#5A6882]">CV Analyzed</div>
                <div className="text-xl font-bold leading-none text-[#ECF0F7]">{completedCv}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,181,71,0.12)] text-[#FFB547]">
                <CalendarClock size={14} />
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#5A6882]">Chờ PV</div>
                <div className="text-xl font-bold leading-none text-[#ECF0F7]">{pendingInterviews}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {isHR && (
            <CvUploadDialog
              onSuccess={(id) => router.push(`/dashboard/recruitment/${id}`)}
              trigger={
                <Button className="h-9 gap-1.5 rounded-lg border-0 bg-[#5B6CF0] px-4 text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(91,108,240,0.3)] transition-all hover:bg-[#4F5FE0] hover:shadow-[0_6px_20px_rgba(91,108,240,0.35)] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Tải lên CV
                </Button>
              }
            />
          )}

          {(isHR || isInterviewer) && (
            <button type="button" onClick={handleExportCsv} disabled={exporting}
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-3.5 text-[11px] font-medium text-[#8B99B0] transition-all hover:border-[#36DDAB]/30 hover:text-[#36DDAB] hover:bg-[#222C4A] disabled:opacity-40">
              <Download className="h-3.5 w-3.5" /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}

          {isRecruiter && (
            <Link href="/dashboard/recruitment/dashboard"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-3.5 text-[11px] font-medium text-[#8B99B0] transition-all hover:border-[#B48EFF]/30 hover:text-[#B48EFF] hover:bg-[#222C4A]">
              <BarChart3 className="h-3.5 w-3.5" /> Báo cáo
            </Link>
          )}

          {isInterviewer && (
            <Link href="/dashboard/recruitment/jd"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-3.5 text-[11px] font-medium text-[#8B99B0] transition-all hover:border-[#36DDAB]/30 hover:text-[#36DDAB] hover:bg-[#222C4A]">
              <FileText className="h-3.5 w-3.5" /> JDs
            </Link>
          )}

          {isAdmin && (
            <Link href="/dashboard/recruitment/settings"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(139,153,176,0.12)] bg-[#1B253B] px-3.5 text-[11px] font-medium text-[#8B99B0] transition-all hover:border-[#FFB547]/30 hover:text-[#FFB547] hover:bg-[#222C4A]">
              <Settings className="h-3.5 w-3.5" /> Cài đặt
            </Link>
          )}

          <div className="ml-auto">
            <ViewSwitcher value={view} onChange={setView} views={["table", "kanban"]} />
          </div>
        </div>
      </div>

      {/* ── FILTER SECTION ──────────────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-20 space-y-2 bg-[#121A2E] pb-2">

        {/* Pipeline status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide rounded-xl border border-[rgba(139,153,176,0.10)] bg-[#1B253B]/80 p-1 backdrop-blur-xl">
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab.key;
            const count = tab.key ? (statusCounts[tab.key] ?? 0) : total;
            return (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className={`flex-none inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#222C4A] text-[#ECF0F7]"
                    : "text-[#5A6882] hover:bg-[#222C4A]/50 hover:text-[#8B99B0]"
                }`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full transition-opacity"
                  style={{ background: tab.dot, opacity: isActive ? 1 : 0.4 }} />
                {tab.label}
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums transition-colors ${
                  isActive ? "bg-[rgba(91,108,240,0.2)] text-[#7C8FFF]" : "bg-[rgba(139,153,176,0.08)] text-[#3D4F6B]"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filter inputs */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(139,153,176,0.10)] bg-[#0D1625]/90 px-3 py-2 backdrop-blur-2xl">
          <div className="relative flex-[2] min-w-[160px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#3D4F6B]" />
            <input type="text" placeholder="Tìm ứng viên, email, vị trí..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-transparent bg-white/[0.03] pl-8 pr-3 text-xs text-[#ECF0F7] outline-none placeholder:text-[#3D4F6B] transition-colors focus:border-[#5B6CF0]/30 focus:bg-white/[0.05]" />
          </div>
          <select value={jdFilter} onChange={(e) => setJdFilter(e.target.value)}
            className="h-8 min-w-[110px] flex-1 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none transition-colors focus:border-[#5B6CF0]/30 cursor-pointer">
            <option value="">Tất cả JD</option>
            {jobDescriptions.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
          </select>
          <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}
            className="h-8 min-w-[110px] flex-1 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none transition-colors focus:border-[#5B6CF0]/30 cursor-pointer">
            <option value="">Tất cả skill</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={cvStatusFilter} onChange={(e) => setCvStatusFilter(e.target.value)}
            className="h-8 w-28 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none transition-colors focus:border-[#5B6CF0]/30 cursor-pointer">
            <option value="">CV status</option>
            {CV_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={minScore} onChange={(e) => setMinScore(e.target.value)} type="number" min="0" max="100" placeholder="Min score"
            className="h-8 w-20 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#ECF0F7] outline-none placeholder:text-[#3D4F6B] transition-colors focus:border-[#5B6CF0]/30" />
          <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} type="number" min="0" max="100" placeholder="Max score"
            className="h-8 w-20 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#ECF0F7] outline-none placeholder:text-[#3D4F6B] transition-colors focus:border-[#5B6CF0]/30" />
          <input value={createdFrom} onChange={(e) => setCreatedFrom(e.target.value)} type="date"
            className="h-8 w-32 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none scheme-dark transition-colors focus:border-[#5B6CF0]/30" />
          <input value={createdTo} onChange={(e) => setCreatedTo(e.target.value)} type="date"
            className="h-8 w-32 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none scheme-dark transition-colors focus:border-[#5B6CF0]/30" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-8 w-36 rounded-lg border border-transparent bg-white/[0.03] px-2 text-xs text-[#5A6882] outline-none transition-colors focus:border-[#5B6CF0]/30 cursor-pointer">
            <option value="date_desc">Ngày (mới nhất)</option>
            <option value="score_desc">Điểm (cao → thấp)</option>
            <option value="score_asc">Điểm (thấp → cao)</option>
          </select>
          <button type="button" onClick={resetFilters} aria-label="Reset filters"
            className={`grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border transition-all ${
              activeFilterCount > 0
                ? "border-[#5B6CF0]/35 bg-[#5B6CF0]/10 text-[#7C8FFF]"
                : "border-transparent bg-white/[0.03] text-[#5A6882] hover:text-[#8B99B0]"
            }`}>
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      {view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-[rgba(139,153,176,0.10)] bg-[#1B253B]">
          <div className="h-px w-full bg-gradient-to-r from-[#5B6CF0]/50 via-[#36DDAB]/20 to-transparent" />
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
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-[rgba(139,153,176,0.12)] bg-[#1B253B] p-4 transition-all hover:border-[#7C8FFF]/30 hover:bg-[#222C4A]"
            >
              {/* Top shimmer on hover */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#5B6CF0] to-[#B48EFF] opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#ECF0F7]">{item.candidateName}</div>
                  <div className="mt-0.5 truncate text-xs text-[#5A6882]">
                    {item.jdTitle !== "—" ? item.jdTitle : "Chưa có JD"}
                  </div>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-semibold ${STATUS_COLORS[item.pipelineStatus] ?? "bg-white/5 text-[#8B99B0]"}`}>
                  {item.pipelineStatus.replace(/_/g, " ")}
                </span>
              </div>

              {item.aiScore != null && (
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-[#5A6882]">AI Score</span>
                    <span className={`font-mono text-[11px] font-bold ${getScoreTone(item.aiScore)}`}>
                      {item.aiScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, item.aiScore))}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[rgba(139,153,176,0.08)] pt-2.5 text-[10px] text-[#5A6882]">
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

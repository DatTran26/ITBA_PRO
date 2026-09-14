"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  Filter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  formatReportQuery,
  getStatusLabel,
  PIPELINE_STATUSES,
  type ReportSnapshot,
  type ReportScope,
} from "@/lib/recruitment/report";

interface JobDescriptionOption {
  id: string;
  title: string;
  department: string | null;
}

function localDateValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function initialRange() {
  const today = localDateValue(new Date());
  return { from: shiftDate(today, -29), to: today };
}

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function formatDays(value: number | null): string {
  return value === null ? "—" : `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ngày`;
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Users; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111B2F] p-4 shadow-lg shadow-black/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B99B0]">{label}</span>
        <Icon size={16} style={{ color: accent }} />
      </div>
      <p className="text-2xl font-semibold text-[#ECF0F7]">{value}</p>
    </div>
  );
}

export default function ReportComingSoonClient() {
  const range = useMemo(initialRange, []);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [jdId, setJdId] = useState("");
  const [department, setDepartment] = useState("");
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionOption[]>([]);
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = useMemo<ReportScope>(() => ({
    from: `${from}T00:00:00+07:00`,
    to: `${to}T23:59:59.999+07:00`,
    jdId: jdId || null,
    department: department || null,
  }), [from, to, jdId, department]);
  const query = useMemo(() => formatReportQuery(scope), [scope]);

  useEffect(() => {
    let active = true;
    fetch("/api/recruitment/job-descriptions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể tải danh sách JD.");
        return response.json() as Promise<{ jobDescriptions?: JobDescriptionOption[] }>;
      })
      .then((data) => {
        if (active) setJobDescriptions(data.jobDescriptions ?? []);
      })
      .catch((reason: unknown) => {
        if (active) console.error("[RecruitmentReport] job descriptions:", reason);
      });
    return () => { active = false; };
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recruitment/report?${query}`, { cache: "no-store" });
      const data = await response.json() as ReportSnapshot & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Không thể tải báo cáo.");
      setSnapshot(data);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Không thể tải báo cáo.";
      setError(message);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(`/api/recruitment/report/export?${query}`, { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error ?? "Không thể xuất báo cáo.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `bao-cao-tuyen-dung-${to}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo Excel.");
    } catch (reason) {
      console.error("[RecruitmentReport] export:", reason);
      toast.error(reason instanceof Error ? reason.message : "Không thể xuất báo cáo.");
    } finally {
      setExporting(false);
    }
  }

  const departments = useMemo(
    () => Array.from(new Set(jobDescriptions.map((item) => item.department).filter((value): value is string => Boolean(value)))).sort(),
    [jobDescriptions],
  );
  const maxStageCount = snapshot ? Math.max(...PIPELINE_STATUSES.map((status) => snapshot.metrics.byStatus[status] ?? 0), 1) : 1;
  const previewActions = snapshot?.actions.slice(0, 40) ?? [];

  return (
    <div className="relative z-10 flex flex-col gap-6 pb-16 pt-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#36DDAB]">
            <ShieldCheck size={13} /> Báo cáo theo phạm vi quyền
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#ECF0F7]">
            <FileBarChart className="text-[#7C8FFF]" size={28} /> Recruitment Report
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8B99B0]">
            Theo dõi hiệu quả pipeline, thời gian tuyển dụng và các hồ sơ cần xử lý tiếp theo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#111B2F] p-3">
          <Filter size={15} className="text-[#7C8FFF]" />
          <input aria-label="Từ ngày" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A1120] px-2 py-1.5 text-sm text-[#ECF0F7]" />
          <span className="text-[#5A6882]">→</span>
          <input aria-label="Đến ngày" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A1120] px-2 py-1.5 text-sm text-[#ECF0F7]" />
          <select aria-label="Lọc theo JD" value={jdId} onChange={(event) => setJdId(event.target.value)} className="max-w-52 rounded-lg border border-white/10 bg-[#0A1120] px-2 py-1.5 text-sm text-[#ECF0F7]">
            <option value="">Tất cả JD</option>
            {jobDescriptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <select aria-label="Lọc theo phòng ban" value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-lg border border-white/10 bg-[#0A1120] px-2 py-1.5 text-sm text-[#ECF0F7]">
            <option value="">Tất cả phòng ban</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => void loadReport()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-[#ECF0F7] transition hover:border-[#7C8FFF]/50 disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
          <button type="button" onClick={() => void handleExport()} disabled={exporting || loading} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF] px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#7C8FFF]/20 disabled:cursor-not-allowed disabled:opacity-50">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Đang tạo…" : "Xuất Excel"}
          </button>
        </div>
      </div>

      {snapshot && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[#7C8FFF]/15 bg-[#7C8FFF]/5 px-4 py-3 text-xs text-[#8B99B0]">
          <span>Kỳ: <b className="text-[#ECF0F7]">{from} → {to}</b></span>
          <span>Phạm vi: <b className="text-[#ECF0F7]">{snapshot.roleScope === "own" ? "Hồ sơ do bạn tạo" : "Toàn bộ recruitment"}</b></span>
          <span>Chi tiết: <b className="text-[#ECF0F7]">{formatNumber(snapshot.applications.length)}/{formatNumber(snapshot.totalMatchingApplications)}</b></span>
          {snapshot.detailTruncated && <span className="inline-flex items-center gap-1 font-medium text-[#FFB547]"><AlertTriangle size={13} /> Đã giới hạn 5.000 dòng chi tiết</span>}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-[#111B2F]"><Loader2 className="animate-spin text-[#7C8FFF]" size={28} /></div>
      ) : error ? (
        <div className="rounded-2xl border border-[#FF6B82]/25 bg-[#FF6B82]/5 p-8 text-center"><AlertTriangle className="mx-auto mb-3 text-[#FF6B82]" size={26} /><p className="text-sm text-[#FFB7C2]">{error}</p><button type="button" onClick={() => void loadReport()} className="mt-4 rounded-lg border border-[#FF6B82]/30 px-4 py-2 text-sm text-[#FFB7C2]">Thử lại</button></div>
      ) : !snapshot ? null : snapshot.metrics.totalApplications === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111B2F] p-12 text-center"><BarChart3 className="mx-auto mb-3 text-[#7C8FFF]" size={30} /><p className="text-sm text-[#8B99B0]">Không có dữ liệu trong phạm vi đã chọn.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Applications" value={formatNumber(snapshot.metrics.totalApplications)} icon={Users} accent="#7C8FFF" />
            <StatCard label="CV đã nhận" value={formatNumber(snapshot.metrics.totalCvsUploaded)} icon={FileBarChart} accent="#B48EFF" />
            <StatCard label="Đã sàng lọc" value={formatNumber(snapshot.metrics.screenedApplications)} icon={Filter} accent="#06B6D4" />
            <StatCard label="Đã phỏng vấn" value={formatNumber(snapshot.metrics.interviewedApplications)} icon={CheckCircle2} accent="#FFB547" />
            <StatCard label="Đã onboard" value={formatNumber(snapshot.metrics.onboardedApplications)} icon={TrendingUp} accent="#36DDAB" />
            <StatCard label="Cần hành động" value={formatNumber(snapshot.actions.length)} icon={AlertTriangle} accent="#FF6B82" />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-white/10 bg-[#111B2F] p-5">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#ECF0F7]">Pipeline hiện tại</h2><p className="mt-1 text-xs text-[#5A6882]">Phân bổ current status trong kỳ báo cáo</p></div><BarChart3 size={18} className="text-[#7C8FFF]" /></div>
              <div className="space-y-3">
                {PIPELINE_STATUSES.map((status) => { const count = snapshot.metrics.byStatus[status] ?? 0; return <div key={status}><div className="mb-1 flex items-center justify-between text-xs"><span className="text-[#8B99B0]">{getStatusLabel(status)}</span><span className="font-mono text-[#ECF0F7]">{formatNumber(count)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#0A1120]"><div className="h-full rounded-full bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF]" style={{ width: `${(count / maxStageCount) * 100}%` }} /></div></div>; })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#111B2F] p-5">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#ECF0F7]">KPI chất lượng & thời gian</h2><p className="mt-1 text-xs text-[#5A6882]">Định nghĩa theo current status và status history</p></div><Clock3 size={18} className="text-[#FFB547]" /></div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-[#8B99B0]">Pass rate</span><b className="text-[#36DDAB]">{formatPercent(snapshot.metrics.passRate)}</b></div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-[#8B99B0]">Offer acceptance</span><b className="text-[#B48EFF]">{formatPercent(snapshot.metrics.offerAcceptanceRate)}</b></div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-[#8B99B0]">Thời gian tuyển dụng TB</span><b className="text-[#ECF0F7]">{formatDays(snapshot.metrics.avgTimeToHireDays)}</b></div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3"><span className="text-[#8B99B0]">Thời gian tuyển dụng median</span><b className="text-[#ECF0F7]">{formatDays(snapshot.metrics.medianTimeToHireDays)}</b></div>
                <div className="flex items-center justify-between"><span className="text-[#8B99B0]">Điểm AI trung bình</span><b className="text-[#7C8FFF]">{formatNumber(snapshot.metrics.avgAiScore)}/100</b></div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#111B2F] p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#ECF0F7]">Theo JD & phòng ban</h2><p className="mt-1 text-xs text-[#5A6882]">So sánh khối lượng và kết quả giữa các vị trí</p></div><TrendingUp size={18} className="text-[#36DDAB]" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-white/10 text-[#5A6882]"><th className="px-3 py-3 font-semibold">Vị trí</th><th className="px-3 py-3 font-semibold">Phòng ban</th><th className="px-3 py-3 text-right font-semibold">Applications</th><th className="px-3 py-3 text-right font-semibold">Sàng lọc</th><th className="px-3 py-3 text-right font-semibold">Phỏng vấn</th><th className="px-3 py-3 text-right font-semibold">Onboard</th><th className="px-3 py-3 text-right font-semibold">Pass rate</th><th className="px-3 py-3 text-right font-semibold">TGT TB</th></tr></thead><tbody>{snapshot.breakdowns.map((row) => <tr key={`${row.jobDescriptionId ?? "none"}-${row.department}`} className="border-b border-white/5 text-[#8B99B0]"><td className="px-3 py-3 font-medium text-[#ECF0F7]">{row.jobTitle}</td><td className="px-3 py-3">{row.department}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.applications)}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.screened)}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.interviewed)}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.onboarded)}</td><td className="px-3 py-3 text-right font-mono text-[#36DDAB]">{formatPercent(row.passRate)}</td><td className="px-3 py-3 text-right">{formatDays(row.avgTimeToHireDays)}</td></tr>)}</tbody></table></div>
          </section>

          {snapshot.trend.length > 0 && <section className="rounded-2xl border border-white/10 bg-[#111B2F] p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#ECF0F7]">Xu hướng theo tháng</h2><p className="mt-1 text-xs text-[#5A6882]">Số hồ sơ tạo mới và trạng thái đã đạt trong từng tháng</p></div><TrendingUp size={18} className="text-[#7C8FFF]" /></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-white/10 text-[#5A6882]"><th className="px-3 py-3 font-semibold">Tháng</th><th className="px-3 py-3 text-right font-semibold">Applications</th><th className="px-3 py-3 text-right font-semibold">Sàng lọc</th><th className="px-3 py-3 text-right font-semibold">Phỏng vấn</th><th className="px-3 py-3 text-right font-semibold">Onboard</th></tr></thead><tbody>{snapshot.trend.map((row) => <tr key={row.month} className="border-b border-white/5 text-[#8B99B0]"><td className="px-3 py-3 font-medium text-[#ECF0F7]">{row.month}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.applications)}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.screened)}</td><td className="px-3 py-3 text-right font-mono">{formatNumber(row.interviewed)}</td><td className="px-3 py-3 text-right font-mono text-[#36DDAB]">{formatNumber(row.onboarded)}</td></tr>)}</tbody></table></div></section>}

          <section className="rounded-2xl border border-white/10 bg-[#111B2F] p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-[#ECF0F7]">Cần hành động</h2><p className="mt-1 text-xs text-[#5A6882]">Tối đa 40 dòng hiển thị trên màn hình; Excel giữ toàn bộ action theo detail limit</p></div><AlertTriangle size={18} className="text-[#FF6B82]" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead><tr className="border-b border-white/10 text-[#5A6882]"><th className="px-3 py-3 font-semibold">Ưu tiên</th><th className="px-3 py-3 font-semibold">Loại</th><th className="px-3 py-3 font-semibold">Ứng viên</th><th className="px-3 py-3 font-semibold">Vị trí</th><th className="px-3 py-3 font-semibold">Trạng thái</th><th className="px-3 py-3 text-right font-semibold">Tuổi</th><th className="px-3 py-3 font-semibold">Đề xuất</th></tr></thead><tbody>{previewActions.length === 0 ? <tr><td colSpan={7} className="px-3 py-8 text-center text-[#5A6882]">Không có hồ sơ cần hành động.</td></tr> : previewActions.map((action, index) => <tr key={`${action.applicationId}-${action.type}-${index}`} className="border-b border-white/5 text-[#8B99B0]"><td className={`px-3 py-3 font-semibold ${action.priority === "HIGH" ? "text-[#FF6B82]" : "text-[#FFB547]"}`}>{action.priority}</td><td className="px-3 py-3 font-mono">{action.type}</td><td className="px-3 py-3 text-[#ECF0F7]">{action.candidateName || "—"}</td><td className="px-3 py-3">{action.jobTitle}</td><td className="px-3 py-3">{getStatusLabel(action.pipelineStatus)}</td><td className="px-3 py-3 text-right font-mono">{action.ageDays}d</td><td className="px-3 py-3">{action.nextAction}</td></tr>)}</tbody></table></div>
            {snapshot.actions.length > previewActions.length && <p className="mt-3 text-right text-xs text-[#5A6882]">+ {formatNumber(snapshot.actions.length - previewActions.length)} action khác trong file Excel</p>}
          </section>
        </>
      )}
    </div>
  );
}

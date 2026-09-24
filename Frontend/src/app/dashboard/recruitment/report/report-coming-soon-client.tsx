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
  TrendingUp,
  Users,
} from "lucide-react";
import {
  formatReportQuery,
  getStatusLabel,
  PIPELINE_STATUSES,
  type ReportSnapshot,
  type ReportScope,
  type ReportActionType,
} from "@/lib/recruitment/report";
import { SharedDashboardPageHeader, TonePill } from "@/components/shares";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { flowAt, toneByName } from "@/lib/ui/tones";

/** Trạng thái rớt khỏi phễu — tô đỏ nhạt thay vì dải flow. */
const DROPPED = new Set(["REJECTED", "FAILED", "OFFER_REJECTED"]);
const PROGRESS = PIPELINE_STATUSES.filter((s) => !DROPPED.has(s));

const ACTION_LABELS: Record<ReportActionType, string> = {
  STALE: "Hồ sơ đứng yên",
  CV_PROCESSING: "CV đang xử lý",
  CV_FAILED: "CV lỗi",
  INTERVIEW_RESULT: "Chờ kết quả PV",
  OFFER_RESPONSE: "Chờ phản hồi offer",
};
const ACTION_TONE: Record<ReportActionType, Parameters<typeof toneByName>[0]> = {
  STALE: "gold",
  CV_PROCESSING: "blue",
  CV_FAILED: "pink",
  INTERVIEW_RESULT: "violet",
  OFFER_RESPONSE: "teal",
};

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
    <div className="flex flex-col gap-5 pb-12">
      <PageBreadcrumb breadcrumbs={[{ label: "Recruitment", href: "/dashboard/recruitment" }, { label: "Report" }]} />
      <SharedDashboardPageHeader
        className="mb-0"
        title="Báo cáo tuyển dụng"
        icon={FileBarChart}
        badge={snapshot ? { label: snapshot.roleScope === "own" ? "Hồ sơ của bạn" : "Toàn bộ", tone: "teal" } : undefined}
        description="Hiệu quả phễu, thời gian tuyển và các hồ sơ cần xử lý tiếp theo trong kỳ"
        actions={
          <Button onClick={() => void handleExport()} disabled={exporting || loading} className="h-10 gap-2 px-4">
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {exporting ? "Đang tạo…" : "Xuất Excel"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <Filter size={15} className="text-primary" />
        <input aria-label="Từ ngày" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground" />
        <span className="text-muted-foreground">→</span>
        <input aria-label="Đến ngày" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground" />
        <select aria-label="Lọc theo JD" value={jdId} onChange={(event) => setJdId(event.target.value)} className="h-9 max-w-64 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
          <option value="">Tất cả JD</option>
          {jobDescriptions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <select aria-label="Lọc theo phòng ban" value={department} onChange={(event) => setDepartment(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground">
          <option value="">Tất cả phòng ban</option>
          {departments.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Button variant="outline" onClick={() => void loadReport()} disabled={loading} className="ml-auto h-9 gap-2">
          <RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới
        </Button>
      </div>

      {snapshot && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Kỳ: <b className="text-foreground">{from} → {to}</b></span>
                    <span>Chi tiết: <b className="text-foreground">{formatNumber(snapshot.applications.length)}/{formatNumber(snapshot.totalMatchingApplications)}</b></span>
          {snapshot.detailTruncated && <span className="inline-flex items-center gap-1 font-medium text-warning"><AlertTriangle size={13} /> Đã giới hạn 5.000 dòng chi tiết</span>}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-border bg-card"><Loader2 className="animate-spin text-primary" size={28} /></div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><AlertTriangle className="mx-auto mb-3 text-destructive" size={26} /><p className="text-sm text-destructive">{error}</p><button type="button" onClick={() => void loadReport()} className="mt-4 rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive">Thử lại</button></div>
      ) : !snapshot ? null : snapshot.metrics.totalApplications === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center"><BarChart3 className="mx-auto mb-3 text-primary" size={30} /><p className="text-sm text-muted-foreground">Không có dữ liệu trong phạm vi đã chọn.</p></div>
      ) : (
        <>
          {/* Phễu chuyển đổi: mỗi bước một màu trên dải flow, % = so với bước trước */}
          <div className="flex items-stretch gap-3">
            <div className="grid flex-1 grid-cols-5 overflow-hidden rounded-2xl border border-border bg-card">
              {[
                { label: "Hồ sơ", value: snapshot.metrics.totalApplications, icon: Users },
                { label: "CV đã nhận", value: snapshot.metrics.totalCvsUploaded, icon: FileBarChart },
                { label: "Đã sàng lọc", value: snapshot.metrics.screenedApplications, icon: Filter },
                { label: "Đã phỏng vấn", value: snapshot.metrics.interviewedApplications, icon: CheckCircle2 },
                { label: "Đã onboard", value: snapshot.metrics.onboardedApplications, icon: TrendingUp },
              ].map((stage, i, all) => {
                const color = flowAt(i, all.length);
                const prev = i > 0 ? all[i - 1].value : null;
                const rate = prev ? Math.round((stage.value / prev) * 100) : null;
                return (
                  <div key={stage.label} className="relative border-l border-border p-4 first:border-l-0">
                    <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <stage.icon className="h-3.5 w-3.5" style={{ color }} /> {stage.label}
                    </div>
                    <p className="mt-2 font-display text-3xl font-black tabular-nums text-foreground">{formatNumber(stage.value)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {rate === null ? "Đầu phễu" : <><b className="text-foreground">{rate}%</b> từ bước trước</>}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex w-44 shrink-0 flex-col justify-between rounded-2xl p-4" style={{ backgroundColor: toneByName("pink").bg, color: toneByName("pink").ink }}>
              <div className="flex items-center gap-2 text-xs font-bold"><AlertTriangle className="h-3.5 w-3.5" /> Cần hành động</div>
              <p className="font-display text-3xl font-black tabular-nums">{formatNumber(snapshot.actions.length)}</p>
              <p className="text-[11px] font-semibold">{snapshot.actions.filter((a) => a.priority === "HIGH").length} ưu tiên cao</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Pipeline hiện tại</h2><p className="mt-1 text-xs text-muted-foreground">Trạng thái hiện tại của hồ sơ trong kỳ · đỏ = rớt khỏi phễu</p></div><BarChart3 size={18} className="text-primary" /></div>
              <div className="space-y-3">
                {PIPELINE_STATUSES.map((status) => { const count = snapshot.metrics.byStatus[status] ?? 0; const dropped = DROPPED.has(status); const color = dropped ? "var(--destructive)" : flowAt(PROGRESS.indexOf(status as (typeof PROGRESS)[number]), PROGRESS.length); return <div key={status} className={count === 0 ? "opacity-50" : ""}><div className="mb-1 flex items-center justify-between text-xs"><span className={dropped ? "text-destructive" : "text-muted-foreground"}>{getStatusLabel(status)}</span><span className="font-semibold tabular-nums text-foreground">{formatNumber(count)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(count / maxStageCount) * 100}%`, backgroundColor: color, opacity: dropped ? 0.7 : 1 }} /></div></div>; })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">KPI chất lượng & thời gian</h2><p className="mt-1 text-xs text-muted-foreground">Tính theo trạng thái hiện tại và lịch sử trạng thái</p></div><Clock3 size={18} className="text-warning" /></div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted-foreground">Pass rate</span><b className="text-success">{formatPercent(snapshot.metrics.passRate)}</b></div>
                <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted-foreground">Offer acceptance</span><b style={{ color: toneByName("violet").ink }}>{formatPercent(snapshot.metrics.offerAcceptanceRate)}</b></div>
                <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted-foreground">Thời gian tuyển dụng TB</span><b className="text-foreground">{formatDays(snapshot.metrics.avgTimeToHireDays)}</b></div>
                <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-muted-foreground">Thời gian tuyển dụng median</span><b className="text-foreground">{formatDays(snapshot.metrics.medianTimeToHireDays)}</b></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Điểm AI trung bình</span><b className="text-primary">{formatNumber(snapshot.metrics.avgAiScore)}/100</b></div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Theo JD & phòng ban</h2><p className="mt-1 text-xs text-muted-foreground">So sánh khối lượng và kết quả giữa các vị trí</p></div><TrendingUp size={18} className="text-success" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="px-3 py-3 font-semibold">Vị trí</th><th className="px-3 py-3 font-semibold">Phòng ban</th><th className="px-3 py-3 text-right font-semibold">Hồ sơ</th><th className="px-3 py-3 text-right font-semibold">Sàng lọc</th><th className="px-3 py-3 text-right font-semibold">Phỏng vấn</th><th className="px-3 py-3 text-right font-semibold">Onboard</th><th className="px-3 py-3 text-right font-semibold">Pass rate</th><th className="px-3 py-3 text-right font-semibold">TGT TB</th></tr></thead><tbody>{snapshot.breakdowns.map((row) => <tr key={`${row.jobDescriptionId ?? "none"}-${row.department}`} className="border-b border-border text-muted-foreground"><td className="px-3 py-3 font-medium text-foreground">{row.jobTitle}</td><td className="px-3 py-3">{row.department}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.applications)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.screened)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.interviewed)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.onboarded)}</td><td className="px-3 py-3 text-right tabular-nums text-success">{formatPercent(row.passRate)}</td><td className="px-3 py-3 text-right">{formatDays(row.avgTimeToHireDays)}</td></tr>)}</tbody></table></div>
          </section>

          {snapshot.trend.length > 0 && <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Xu hướng theo tháng</h2><p className="mt-1 text-xs text-muted-foreground">Số hồ sơ tạo mới và trạng thái đã đạt trong từng tháng</p></div><TrendingUp size={18} className="text-primary" /></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="px-3 py-3 font-semibold">Tháng</th><th className="px-3 py-3 text-right font-semibold">Hồ sơ</th><th className="px-3 py-3 text-right font-semibold">Sàng lọc</th><th className="px-3 py-3 text-right font-semibold">Phỏng vấn</th><th className="px-3 py-3 text-right font-semibold">Onboard</th></tr></thead><tbody>{snapshot.trend.map((row) => <tr key={row.month} className="border-b border-border text-muted-foreground"><td className="px-3 py-3 font-medium text-foreground">{row.month}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.applications)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.screened)}</td><td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.interviewed)}</td><td className="px-3 py-3 text-right tabular-nums text-success">{formatNumber(row.onboarded)}</td></tr>)}</tbody></table></div></section>}

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-base font-semibold text-foreground">Cần hành động</h2><p className="mt-1 text-xs text-muted-foreground">Hiện tối đa 40 dòng — file Excel có đầy đủ</p></div><AlertTriangle size={18} className="text-destructive" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground"><th className="px-3 py-3 font-semibold">Ưu tiên</th><th className="px-3 py-3 font-semibold">Loại</th><th className="px-3 py-3 font-semibold">Ứng viên</th><th className="px-3 py-3 font-semibold">Vị trí</th><th className="px-3 py-3 font-semibold">Trạng thái</th><th className="px-3 py-3 text-right font-semibold">Tuổi</th><th className="px-3 py-3 font-semibold">Đề xuất</th></tr></thead><tbody>{previewActions.length === 0 ? <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">Không có hồ sơ cần hành động.</td></tr> : previewActions.map((action, index) => <tr key={`${action.applicationId}-${action.type}-${index}`} className="border-b border-border text-muted-foreground"><td className="px-3 py-3">{action.priority === "HIGH" ? <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">Cao</span> : <TonePill tone={toneByName("orange")}>Vừa</TonePill>}</td><td className="px-3 py-3"><TonePill tone={toneByName(ACTION_TONE[action.type] ?? "blue")}>{ACTION_LABELS[action.type] ?? action.type}</TonePill></td><td className="px-3 py-3 text-foreground">{action.candidateName || "—"}</td><td className="px-3 py-3">{action.jobTitle}</td><td className="px-3 py-3">{getStatusLabel(action.pipelineStatus)}</td><td className="px-3 py-3 text-right tabular-nums">{action.ageDays} ngày</td><td className="px-3 py-3">{action.nextAction}</td></tr>)}</tbody></table></div>
            {snapshot.actions.length > previewActions.length && <p className="mt-3 text-right text-xs text-muted-foreground">+ {formatNumber(snapshot.actions.length - previewActions.length)} việc khác trong file Excel</p>}
          </section>
        </>
      )}
    </div>
  );
}

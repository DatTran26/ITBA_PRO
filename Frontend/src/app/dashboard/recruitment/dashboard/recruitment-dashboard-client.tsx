"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart3, ArrowDownWideNarrow } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import { Skeleton } from "@/components/ui/skeleton";

const FIELD = "h-10 px-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary/50";

interface DashboardData {
  totalCvsUploaded: number;
  byStatus: Record<string, number>;
  avgAiScore: number;
  passRate: number;
  offerAcceptanceRate: number;
  funnel: Array<{ stage: string; count: number }>;
  processingQueue: number;
}

interface JdOption { id: string; title: string; is_active?: boolean }
interface Row { jd: JdOption; data: DashboardData; total: number }

/* Bước theo thứ tự → dải tuần tự một tông (nhạt → đậm), không phải màu phân loại. */
const STAGES = ["NEW", "SCREENED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "PASSED", "OFFERED", "ONBOARDED"];
const STAGE_LABEL: Record<string, string> = {
  NEW: "Mới", SCREENED: "Sàng lọc", SHORTLISTED: "Tiềm năng", INTERVIEW_SCHEDULED: "Hẹn PV",
  INTERVIEWED: "Đã PV", PASSED: "Đạt", OFFERED: "Đề xuất", ONBOARDED: "Onboard",
};
const RAMP = [18, 30, 42, 54, 66, 78, 89, 100];
const stageColor = (i: number) => `color-mix(in srgb, var(--primary) ${RAMP[i]}%, var(--card))`;
const OUT_COLOR = "var(--muted-foreground)";

// ponytail: gọi RPC một lần mỗi JD (tối đa 8); cần RPC group-by-JD nếu số JD lớn hơn.
const MAX_JDS = 8;
type SortKey = "total" | "avgAiScore" | "passRate";

function toDateInput(iso: string) { return iso.split("T")[0]; }
function fromDateInput(date: string) { return new Date(date).toISOString(); }
const sumStatus = (d: DashboardData) => Object.values(d.byStatus ?? {}).reduce((a, b) => a + b, 0);

function StageBar({ funnel, total }: { funnel: DashboardData["funnel"]; total: number }) {
  const count = (st: string) => funnel.find((f) => f.stage === st)?.count ?? 0;
  if (!total) return <div className="h-3 rounded-full bg-muted" />;
  const out = total - STAGES.reduce((a, st) => a + count(st), 0);
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5 bg-muted">
      {STAGES.map((st, i) => {
        const n = count(st);
        return n ? (
          <span key={st} title={`${STAGE_LABEL[st]}: ${n}`} className="h-full"
                style={{ width: `${(n / total) * 100}%`, backgroundColor: stageColor(i) }} />
        ) : null;
      })}
      {out > 0 && <span title={`Loại: ${out}`} className="h-full opacity-50" style={{ width: `${(out / total) * 100}%`, backgroundColor: OUT_COLOR }} />}
    </div>
  );
}

function Meter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <div>
      <p className="text-lg font-black tabular-nums text-foreground leading-none">{Math.round(value)}{suffix}</p>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

export default function RecruitmentDashboardClient() {
  const [overall, setOverall] = useState<DashboardData | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [jds, setJds] = useState<JdOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 30 * 86400_000).toISOString()));
  const [to, setTo] = useState(() => toDateInput(new Date().toISOString()));
  const [sortBy, setSortBy] = useState<SortKey>("total");

  useEffect(() => {
    fetch("/api/recruitment/job-descriptions")
      .then((r) => r.json())
      .then((d) => setJds((d.jobDescriptions ?? []).filter((j: JdOption) => j.is_active !== false).slice(0, MAX_JDS)))
      .catch(() => setJds([]));
  }, []);

  const fetchData = useCallback(async () => {
    if (!jds) return;
    setLoading(true);
    const base = { from: fromDateInput(from), to: fromDateInput(to) };
    const get = async (jdId?: string) => {
      const params = new URLSearchParams(jdId ? { ...base, jd_id: jdId } : base);
      const res = await fetch(`/api/recruitment/dashboard?${params}`);
      return res.ok ? (await res.json() as DashboardData) : null;
    };
    const [all, ...perJd] = await Promise.all([get(), ...jds.map((j) => get(j.id))]);
    setOverall(all);
    setRows(jds.flatMap((jd, i) => (perJd[i] ? [{ jd, data: perJd[i]!, total: sumStatus(perJd[i]!) }] : [])));
    setLoading(false);
  }, [from, to, jds]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sorted = useMemo(() => [...rows].sort((a, b) =>
    sortBy === "total" ? b.total - a.total : b.data[sortBy] - a.data[sortBy]), [rows, sortBy]);
  const totalApps = overall ? sumStatus(overall) : 0;
  // Tóm tắt chỉ tính JD có ≥2 hồ sơ, tránh "cao nhất" nhờ một hồ sơ duy nhất.
  const best = [...rows].filter((r) => r.total >= 2).sort((a, b) => b.data.avgAiScore - a.data.avgAiScore)[0] ?? null;

  return (
    <div className="py-6 flex flex-col gap-6">
      <SharedDashboardPageHeader
        className="mb-2"
        title="So sánh vị trí tuyển"
        icon={BarChart3}
        badge={overall ? { label: `${totalApps} hồ sơ · ${rows.length} JD` } : undefined}
        description="Mỗi JD đang có bao nhiêu hồ sơ, dồn ở bước nào và chất lượng ra sao trong kỳ đã chọn"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" aria-label="Từ ngày" value={from} onChange={(e) => setFrom(e.target.value)} className={FIELD} />
            <span className="text-muted-foreground text-sm">-</span>
            <input type="date" aria-label="Đến ngày" value={to} onChange={(e) => setTo(e.target.value)} className={FIELD} />
          </div>
        )}
      />

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-[96px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      ) : !overall ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-danger text-sm">Không thể tải dữ liệu.</div>
      ) : (
        <>
          {/* Dải tổng hợp: một hàng số, câu tóm tắt bên phải */}
          <section className="rounded-2xl border border-border bg-card px-6 py-5 flex items-center gap-10 shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            {[
              ["CV trong kỳ", overall.totalCvsUploaded, ""],
              ["Điểm AI TB", overall.avgAiScore, "/100"],
              ["Tỉ lệ đạt PV", overall.passRate, "%"],
              ["Nhận offer", overall.offerAcceptanceRate, "%"],
              ["Chờ AI xử lý", overall.processingQueue, ""],
            ].map(([label, v, suf]) => (
              <div key={label as string}>
                <p className="text-3xl font-black tabular-nums text-foreground leading-none">
                  {Math.round(Number(v))}<span className="text-base text-muted-foreground">{suf}</span>
                </p>
                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
            {best && (
              <p className="ml-auto max-w-xs text-sm text-muted-foreground">
                Chất lượng hồ sơ cao nhất: <span className="font-bold text-foreground">{best.jd.title}</span> với điểm AI trung bình{" "}
                <span className="font-bold text-foreground tabular-nums">{Math.round(best.data.avgAiScore)}</span>.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Theo từng JD</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {STAGES.map((st, i) => (
                    <span key={st} className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stageColor(i) }} />{STAGE_LABEL[st]}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm opacity-50" style={{ backgroundColor: OUT_COLOR }} />Loại
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ArrowDownWideNarrow className="w-4 h-4" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-bold text-foreground cursor-pointer">
                  <option value="total">Nhiều hồ sơ nhất</option>
                  <option value="avgAiScore">Điểm AI cao nhất</option>
                  <option value="passRate">Tỉ lệ đạt cao nhất</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-[minmax(300px,1.3fr)_70px_minmax(280px,2fr)_120px_120px] gap-6 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/40">
              <span>Vị trí</span><span>Hồ sơ</span><span>Đang ở bước</span><span>Điểm AI TB</span><span>Tỉ lệ đạt</span>
            </div>
            {sorted.length === 0 && <p className="px-6 py-12 text-center text-sm text-muted-foreground">Chưa có JD nào đang dùng.</p>}
            <ul className="divide-y divide-border">
              {sorted.map(({ jd, data, total }) => (
                <li key={jd.id} className="grid grid-cols-[minmax(300px,1.3fr)_70px_minmax(280px,2fr)_120px_120px] items-center gap-6 px-6 py-4 hover:bg-muted/40 transition-colors">
                  <p className="font-bold text-foreground truncate" title={jd.title}>{jd.title}</p>
                  <p className="text-2xl font-black tabular-nums text-foreground">{total}</p>
                  <StageBar funnel={data.funnel ?? []} total={total} />
                  <Meter value={data.avgAiScore} />
                  <Meter value={data.passRate} suffix="%" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

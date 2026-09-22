"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, TrendingUp, Clock, Award, Handshake } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import RecruitmentRibbonFunnel from "@/components/dashboard/recruitment-ribbon-funnel";
import OverviewBand from "@/components/shares/overview-band";
import { SharedDashboardPageHeader } from "@/components/shares";
import { HBarList } from "@/components/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABELS } from "@/lib/recruitment/report";
import type { KpiCardData } from "@/lib/crm/types";

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

interface JdOption { id: string; title: string }

function toDateInput(iso: string) { return iso.split("T")[0]; }
function fromDateInput(date: string) { return new Date(date).toISOString(); }

export default function RecruitmentDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [jds, setJds] = useState<JdOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 30 * 86400_000).toISOString()));
  const [to, setTo] = useState(() => toDateInput(new Date().toISOString()));
  const [jdId, setJdId] = useState("");

  useEffect(() => {
    fetch("/api/recruitment/job-descriptions")
      .then((r) => r.json())
      .then((d) => setJds((d.jobDescriptions ?? []).map((j: { id: string; title: string }) => ({ id: j.id, title: j.title }))));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ from: fromDateInput(from), to: fromDateInput(to) });
    if (jdId) params.set("jd_id", jdId);
    const res = await fetch(`/api/recruitment/dashboard?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [from, to, jdId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalApps = data ? Object.values(data.byStatus ?? {}).reduce((a, b) => a + b, 0) : 0;

  const kpis: KpiCardData[] = data ? [
    { label: "CVs Uploaded", value: data.totalCvsUploaded, icon: Users, badge: "Trong kỳ" },
    { label: "Total Applications", value: totalApps, icon: BarChart3, badge: "Hồ sơ" },
    { label: "Avg AI Score", value: `${data.avgAiScore}/100`, icon: Award, badge: "Chất lượng" },
    { label: "Pass Rate", value: `${data.passRate}%`, icon: TrendingUp, badge: "Vòng phỏng vấn" },
    { label: "Offer Acceptance", value: `${data.offerAcceptanceRate}%`, icon: Handshake, badge: "Giai đoạn cuối" },
    { label: "Processing Queue", value: data.processingQueue, icon: Clock, badge: "Chờ AI" },
  ] : [];

  const byStatus = data
    ? Object.entries(data.byStatus ?? {}).map(([k, v]) => ({ label: STATUS_LABELS[k] ?? k, value: v }))
    : [];

  return (
    <div className="py-6 flex flex-col gap-6">
      <SharedDashboardPageHeader
        className="mb-2"
        title="Recruitment Dashboard"
        icon={BarChart3}
        badge={data ? { label: `${totalApps} hồ sơ` } : undefined}
        description="Phễu tuyển dụng và chất lượng hồ sơ theo khoảng thời gian"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" aria-label="Từ ngày" value={from} onChange={(e) => setFrom(e.target.value)} className={FIELD} />
            <span className="text-muted-foreground text-sm">-</span>
            <input type="date" aria-label="Đến ngày" value={to} onChange={(e) => setTo(e.target.value)} className={FIELD} />
            <select aria-label="Lọc theo JD" value={jdId} onChange={(e) => setJdId(e.target.value)} className={FIELD}>
              <option value="">All JDs</option>
              {jds.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        )}
      />

      {loading ? (
        <div className="flex flex-col gap-6" aria-busy="true">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[124px] rounded-2xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[440px] rounded-2xl" />
            <Skeleton className="h-[440px] rounded-2xl" />
          </div>
        </div>
      ) : !data ? (
        <div className="glass-card p-10 text-center text-danger text-sm">Không thể tải dữ liệu.</div>
      ) : (
        <>
          <KpiCardGrid items={kpis} />

          <OverviewBand className="lg:grid-cols-2 mb-0">
            <RecruitmentRibbonFunnel
              funnel={data.funnel ?? []}
              avgAiScore={data.avgAiScore}
              offerAcceptanceRate={data.offerAcceptanceRate}
              processingQueue={data.processingQueue}
            />
            <HBarList
              title="Hồ sơ theo trạng thái"
              subtitle="Phân bố pipeline trong kỳ đã chọn"
              tag={{ label: "Pipeline", tone: "violet" }}
              items={byStatus}
              max={8}
            />
          </OverviewBand>
        </>
      )}
    </div>
  );
}

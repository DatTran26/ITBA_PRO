"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, TrendingUp, Clock, Award, Handshake } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import StageFunnel from "@/components/recruitment/stage-funnel";
import type { KpiCardData } from "@/lib/crm/types";

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
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 30 * 86400_000).toISOString()));
  const [to, setTo] = useState(toDateInput(new Date().toISOString()));
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
    { label: "CVs Uploaded", value: data.totalCvsUploaded, icon: Users },
    { label: "Total Applications", value: totalApps, icon: BarChart3 },
    { label: "Avg AI Score", value: `${data.avgAiScore}/100`, icon: Award },
    { label: "Pass Rate", value: `${data.passRate}%`, icon: TrendingUp },
    { label: "Offer Acceptance", value: `${data.offerAcceptanceRate}%`, icon: Handshake },
    { label: "Processing Queue", value: data.processingQueue, icon: Clock },
  ] : [];

  return (
    <div className="py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-xl font-semibold text-foreground">Recruitment Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-background border border-border/20 text-foreground text-sm focus:outline-none focus:border-border/50" />
          <span className="text-muted-foreground text-sm">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-background border border-border/20 text-foreground text-sm focus:outline-none focus:border-border/50" />
          <select value={jdId} onChange={(e) => setJdId(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-background border border-border/20 text-foreground text-sm focus:outline-none focus:border-border/50">
            <option value="">All JDs</option>
            {jds.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-border/30 border-t-border rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="glass-card p-10 text-center text-danger text-sm">Không thể tải dữ liệu.</div>
      ) : (
        <>
          <KpiCardGrid items={kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StageFunnel stages={data.funnel ?? []} />

            <div className="glass-card p-5 flex flex-col gap-3">
              <h2 className="text-sm font-medium text-foreground">Applications by Status</h2>
              <div className="flex flex-col gap-1.5">
                {Object.entries(data.byStatus ?? {}).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status}</span>
                    <span className="font-mono text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

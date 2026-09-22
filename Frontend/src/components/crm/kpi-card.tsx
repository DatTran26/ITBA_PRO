"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiCardData } from "@/lib/crm/types";

interface KpiCardProps {
  data: KpiCardData;
}

export default function KpiCard({ data }: KpiCardProps) {
  const { label, value, icon: Icon, trend, trendLabel } = data;

  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="w-3 h-3" />
    ) : trend === "down" ? (
      <TrendingDown className="w-3 h-3" />
    ) : (
      <Minus className="w-3 h-3" />
    );

  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-danger"
        : "text-muted-foreground";

  return (
    <Card className="bg-card border-border rounded-2xl hover:border-primary/30 transition-colors duration-300 group shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-bold ${trendColor}`}>
              {trendIcon}
              {trendLabel && <span className="tracking-tight">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="mt-5">
          <div className="text-3xl font-extralight tracking-tighter text-foreground leading-none mb-1 font-display tabular-nums">{value}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

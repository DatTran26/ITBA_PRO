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
      ? "text-[#22C55E]"
      : trend === "down"
        ? "text-[#EF4444]"
        : "text-[#8B99B0]";

  return (
    <Card className="bg-[#1B253B]/40 border-white/5 rounded-2xl backdrop-blur-xl hover:border-[#7C8FFF]/30 hover:bg-[#1B253B]/60 transition-all duration-500 group shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C8FFF]/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-[#7C8FFF]/10 transition-colors" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-[#7C8FFF]/10 border border-[#7C8FFF]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <Icon className="w-5 h-5 text-[#7C8FFF]" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/20 border border-white/5 text-[10px] font-bold ${trendColor}`}>
              {trendIcon}
              {trendLabel && <span className="tracking-tight">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className="mt-5 relative z-10">
          <div className="text-3xl font-extralight tracking-tighter text-[#ECF0F7] leading-none mb-1 font-display">{value}</div>
          <div className="text-[10px] uppercase tracking-widest text-[#5A6882] font-semibold opacity-70 group-hover:opacity-100 transition-opacity">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

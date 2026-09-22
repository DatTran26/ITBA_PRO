"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiCardData } from "@/lib/crm/types";
import { toneAt, toneByName } from "@/lib/ui/tones";

interface KpiCardProps {
  data: KpiCardData;
  /** Vị trí trong lưới: chọn tông mặc định + trễ xuất hiện. */
  index?: number;
}

/** Ô KPI theo dashboard HR (bento-metric-strip): nhãn + icon tông màu,
 *  con số đậm, pill phía dưới (trend hoặc badge). */
export default function KpiCard({ data, index = 0 }: KpiCardProps) {
  const { label, value, icon: Icon, trend, trendLabel, tone: toneName, badge } = data;
  const reduce = useReducedMotion();
  const tone = toneName ? toneByName(toneName) : toneAt(index);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendVar = trend === "up" ? "var(--success)" : trend === "down" ? "var(--danger)" : "var(--muted-foreground)";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
      className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between min-h-[124px] shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)] hover:border-accent transition-[box-shadow,border-color] duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground truncate leading-tight" title={label}>
          {label}
        </span>
        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: tone.bg }}>
          <Icon className="w-4 h-4" style={{ color: tone.mark }} />
        </span>
      </div>

      <div className="mt-2.5">
        <div className="text-[28px] font-extrabold tracking-tight text-foreground tabular-nums leading-none">
          {value}
        </div>
        {trend && trendLabel ? (
          <span
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ color: trendVar, backgroundColor: `color-mix(in srgb, ${trendVar} 12%, transparent)` }}
          >
            <TrendIcon className="w-3 h-3" />
            {trendLabel}
          </span>
        ) : badge ? (
          <span
            className="mt-2 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ color: tone.ink, backgroundColor: tone.bg }}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

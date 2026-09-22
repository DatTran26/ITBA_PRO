"use client";

import KpiCard from "@/components/crm/kpi-card";
import type { KpiCardData } from "@/lib/crm/types";

interface KpiCardGridProps {
  items: KpiCardData[];
}

/* Lưới co theo số ô để hàng không chừa ô trống (4 KPI → 4 cột, không phải 6). */
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 xl:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
};

export default function KpiCardGrid({ items }: KpiCardGridProps) {
  return (
    <div className={`grid gap-3.5 ${COLS[Math.min(items.length, 6)] ?? COLS[6]}`}>
      {items.map((item, index) => (
        <KpiCard key={index} data={item} index={index} />
      ))}
    </div>
  );
}

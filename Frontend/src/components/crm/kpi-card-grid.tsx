"use client";

import KpiCard from "@/components/crm/kpi-card";
import type { KpiCardData } from "@/lib/crm/types";

interface KpiCardGridProps {
  items: KpiCardData[];
}

export default function KpiCardGrid({ items }: KpiCardGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {items.map((item, index) => (
        <KpiCard key={index} data={item} index={index} />
      ))}
    </div>
  );
}

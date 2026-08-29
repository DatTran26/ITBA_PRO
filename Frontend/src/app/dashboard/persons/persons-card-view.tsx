"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/crm/status-badge";
import TagChips from "@/components/crm/tag-chips";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import { Mail, Building2 } from "lucide-react";
import EntityEmptyState from "@/components/management/entity-empty-state";
import { Users } from "lucide-react";
import type { PersonListItem } from "@/app/dashboard/management-types";

interface Props {
  data: PersonListItem[];
  onCardClick: (p: PersonListItem) => void;
}

export default function PersonsCardView({ data, onCardClick }: Props) {
  if (!data.length) {
    return <EntityEmptyState icon={Users} title="No persons found" description="Try different filters" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((p) => (
        <Card
          key={p.id}
          onClick={() => onCardClick(p)}
          className="bg-[#1B253B] border-[#8B99B0]/10 hover:border-[#7C8FFF]/40 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(124,143,255,0.08)] p-4 group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C8FFF]/20 to-[#B48EFF]/20 flex items-center justify-center text-[#7C8FFF] font-bold text-sm">
              {p.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-[10px] capitalize ${p.type === "employee" ? "border-[#50FA7B]/30 text-[#50FA7B]" : "border-[#8BE9FD]/30 text-[#8BE9FD]"}`}>
                {p.type}
              </Badge>
              <StatusBadge status={p.status} config={PERSON_STATUSES} />
            </div>
          </div>
          <p className="font-semibold text-[#ECF0F7] text-sm truncate group-hover:text-white">{p.full_name}</p>
          {p.email && <p className="text-xs text-[#5A6882] flex items-center gap-1 mt-1 truncate"><Mail className="w-3 h-3 shrink-0" />{p.email}</p>}
          {p.position_title && <p className="text-xs text-[#8B99B0] flex items-center gap-1 mt-1 truncate"><Building2 className="w-3 h-3 shrink-0" />{p.position_title}</p>}
          {p.tags && p.tags.length > 0 && (
            <div className="mt-2"><TagChips tags={p.tags.slice(0, 3)} /></div>
          )}
        </Card>
      ))}
    </div>
  );
}

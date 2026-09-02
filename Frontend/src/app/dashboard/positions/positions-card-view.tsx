"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, ListChecks, Users } from "lucide-react";
import StatusBadge from "@/components/crm/status-badge";
import TagChips from "@/components/crm/tag-chips";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import EntityEmptyState from "@/components/management/entity-empty-state";
import type { PositionListItem } from "@/app/dashboard/management-types";

interface Props {
  data: PositionListItem[];
  onCardClick: (p: PositionListItem) => void;
}

function getReqCount(pos: PositionListItem): number {
  const r = pos.position_skill_requirements;
  if (Array.isArray(r)) return r[0]?.count ?? 0;
  return (r as { count: number })?.count ?? 0;
}

export default function PositionsCardView({ data, onCardClick }: Props) {
  if (!data.length) {
    return <EntityEmptyState icon={Briefcase} title="No positions found" description="Try adjusting your filters" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((pos) => {
        const reqCount = getReqCount(pos);
        return (
          <Card
            key={pos.id}
            onClick={() => onCardClick(pos)}
            className="bg-[#1B253B] border-[#8B99B0]/10 hover:border-[#7C8FFF]/40 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(124,143,255,0.08)] p-4 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#222C4A] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#7C8FFF]" />
              </div>
              <StatusBadge status={pos.status} config={POSITION_STATUSES} />
            </div>
            <p className="font-semibold text-[#ECF0F7] text-sm truncate group-hover:text-white">{pos.title}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#5A6882]">
              {pos.department && (
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{pos.department}</span>
              )}
              {pos.target_level && (
                <Badge variant="outline" className="text-[10px] border-[#B48EFF]/30 text-[#B48EFF] px-1.5 py-0">{pos.target_level}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#5A6882]">
              <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" />{reqCount} req{reqCount !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{pos.assigned_persons_count ?? 0} assigned</span>
            </div>
            {pos.tags && pos.tags.length > 0 && (
              <div className="mt-2">
                <TagChips tags={pos.tags.slice(0, 3)} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

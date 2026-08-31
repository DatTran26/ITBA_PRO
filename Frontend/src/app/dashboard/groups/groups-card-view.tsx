"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/crm/status-badge";
import ScoreRing from "@/components/crm/score-ring";
import EntityEmptyState from "@/components/management/entity-empty-state";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import type { GroupListItem } from "@/app/dashboard/management-types";

const TYPE_COLORS: Record<string, string> = {
  department: "border-[#50FA7B]/30 text-[#50FA7B]",
  batch:      "border-[#8BE9FD]/30 text-[#8BE9FD]",
  campaign:   "border-[#FFB86C]/30 text-[#FFB86C]",
  other:      "border-[#8B99B0]/30 text-[#8B99B0]",
};

function getMemberCount(g: GroupListItem): number {
  const m = g.group_members;
  if (Array.isArray(m)) return m[0]?.count ?? 0;
  return (m as { count: number })?.count ?? 0;
}

interface Props {
  groups: GroupListItem[];
  onCardClick: (g: GroupListItem) => void;
  onEdit: (g: GroupListItem) => void;
}

export default function GroupsCardView({ groups, onCardClick, onEdit }: Props) {
  if (!groups.length) {
    return <EntityEmptyState icon={FolderKanban} title="No groups found" description="Try adjusting your filters" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((g) => {
        const memberCount = getMemberCount(g);
        const score = g.health_score ?? 0;
        return (
          <Card
            key={g.id}
            onClick={() => onCardClick(g)}
            className="bg-[#1B253B] border-[#8B99B0]/10 hover:border-[#7C8FFF]/40 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(124,143,255,0.08)] p-4 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#222C4A] flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5 text-[#7C8FFF]" />
                </div>
                <Badge variant="outline" className={`text-xs capitalize ${TYPE_COLORS[g.type] ?? TYPE_COLORS.other}`}>
                  {g.type}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <ScoreRing value={score} size={36} />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onEdit(g); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5A6882] hover:text-[#ECF0F7] hover:bg-[#222C4A]"
                  aria-label="Edit group"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <p className="font-semibold text-[#ECF0F7] text-sm truncate group-hover:text-white">{g.name}</p>
            {g.description && (
              <p className="text-xs text-[#5A6882] mt-1 line-clamp-2">{g.description}</p>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[#5A6882] flex items-center gap-1">
                <Users className="w-3 h-3" />
                {memberCount} member{memberCount !== 1 ? "s" : ""}
              </span>
              <StatusBadge status={g.status} config={GROUP_STATUSES} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

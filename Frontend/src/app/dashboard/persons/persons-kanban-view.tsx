"use client";

import KanbanBoard from "@/components/crm/kanban-board";
import { Card } from "@/components/ui/card";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { PersonListItem, PersonStatus } from "@/app/dashboard/management-types";

interface Props {
  data: PersonListItem[];
  onCardClick: (p: PersonListItem) => void;
}

export default function PersonsKanbanView({ data, onCardClick }: Props) {
  const columns = Object.entries(PERSON_STATUSES).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    color: cfg.color,
    items: data.filter((p) => p.status === (key as PersonStatus)),
  }));

  return (
    <KanbanBoard
      columns={columns}
      renderCard={(p) => (
        <Card
          onClick={() => onCardClick(p)}
          className="bg-[#222C4A]/60 border-[#8B99B0]/10 p-3 cursor-pointer hover:border-[#7C8FFF]/30 transition-colors"
        >
          <p className="text-sm font-medium text-[#ECF0F7] truncate">{p.full_name}</p>
          {p.position_title && (
            <p className="text-xs text-[#5A6882] mt-0.5 truncate">{p.position_title}</p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-[#8B99B0] capitalize">{p.type}</span>
            {(p.skills_count ?? 0) > 0 && (
              <span className="text-[10px] text-[#7C8FFF]">{p.skills_count} skills</span>
            )}
          </div>
        </Card>
      )}
    />
  );
}

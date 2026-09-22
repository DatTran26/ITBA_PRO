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
          className="bg-accent/60 border-border/10 p-3 cursor-pointer hover:border-border/30 transition-colors"
        >
          <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
          {p.position_title && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.position_title}</p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground capitalize">{p.type}</span>
            {(p.skills_count ?? 0) > 0 && (
              <span className="text-[10px] text-primary">{p.skills_count} skills</span>
            )}
          </div>
        </Card>
      )}
    />
  );
}

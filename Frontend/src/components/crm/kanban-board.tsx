"use client";

import type { ReactNode } from "react";
import KanbanColumn from "@/components/crm/kanban-column";

interface KanbanColumnDef<T> {
  key: string;
  label: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumnDef<T>[];
  renderCard: (item: T) => ReactNode;
  emptyMessage?: string;
}

export default function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  emptyMessage = "No columns configured",
}: KanbanBoardProps<T>) {
  if (!columns.length) {
    return (
      <div className="flex items-center justify-center py-16 border border-border/10 rounded-lg">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns.map((col) => (
        <KanbanColumn key={col.key} label={col.label} color={col.color} count={col.items.length}>
          {col.items.map((item) => (
            <div key={item.id}>{renderCard(item)}</div>
          ))}
        </KanbanColumn>
      ))}
    </div>
  );
}

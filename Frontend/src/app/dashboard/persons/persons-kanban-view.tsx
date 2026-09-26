"use client";

import KanbanBoard from "@/components/crm/kanban-board";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import { toneFor } from "@/lib/ui/tones";
import type { PersonListItem, PersonStatus } from "@/app/dashboard/management-types";

interface Props {
  data: PersonListItem[];
  onCardClick: (p: PersonListItem) => void;
}

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
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
      renderCard={(p) => {
        const t = toneFor(p.full_name);
        return (
          <button
            type="button"
            onClick={() => onCardClick(p)}
            className="w-full text-left rounded-xl bg-card border border-border p-3 cursor-pointer transition-shadow hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--primary)_14%,transparent)]"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 shrink-0 rounded-full grid place-items-center text-[11px] font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>
                {initials(p.full_name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{p.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.position_title ?? p.department ?? "Chưa gán vị trí"}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.type === "candidate" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {p.type === "candidate" ? "Ứng viên" : "Nhân viên"}
              </span>
              {p.current_level && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold capitalize text-foreground">{p.current_level}</span>
              )}
              {(p.skills_count ?? 0) > 0 && (
                <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">{p.skills_count} kỹ năng</span>
              )}
            </div>
            {!!p.group_names?.length && (
              <p className="mt-2 text-[11px] text-muted-foreground truncate">{p.group_names.join(" · ")}</p>
            )}
          </button>
        );
      }}
    />
  );
}

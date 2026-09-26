"use client";

import { Briefcase, Building2, ListChecks, AlertTriangle } from "lucide-react";
import EntityEmptyState from "@/components/management/entity-empty-state";
import { toneAt } from "@/lib/ui/tones";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import type { PositionListItem } from "@/app/dashboard/management-types";

const LEVELS = ["intern", "junior", "middle", "senior", "lead"];
const NO_DEPT = "Chưa gán phòng ban";

export function reqCount(p: PositionListItem): number {
  const r = p.position_skill_requirements;
  return Array.isArray(r) ? (r[0]?.count ?? 0) : (r?.count ?? 0);
}

function LevelLadder({ level, color }: { level: string | null; color: string }) {
  const idx = LEVELS.indexOf((level ?? "").toLowerCase());
  return (
    <div className="flex items-center gap-2" title={level ?? "Chưa đặt cấp độ"}>
      <div className="flex items-end gap-0.5">
        {LEVELS.map((l, i) => (
          <span key={l} className="w-1.5 rounded-sm"
                style={{ height: 6 + i * 3, backgroundColor: i <= idx ? color : "var(--border)" }} />
        ))}
      </div>
      <span className="text-xs font-bold capitalize text-foreground">{level ?? "—"}</span>
    </div>
  );
}

/** Làn theo phòng ban: mỗi cột là một phòng, thẻ vị trí xếp dọc — đọc như sơ đồ tổ chức. */
export default function PositionsLanes({ data, onOpen }: { data: PositionListItem[]; onOpen: (p: PositionListItem) => void }) {
  if (!data.length) {
    return <EntityEmptyState icon={Briefcase} title="Không có vị trí nào" description="Thử bỏ bớt bộ lọc" />;
  }

  const lanes = new Map<string, PositionListItem[]>();
  for (const p of data) {
    const d = p.department || NO_DEPT;
    lanes.set(d, [...(lanes.get(d) ?? []), p]);
  }
  const ordered = [...lanes].sort((a, b) =>
    a[0] === NO_DEPT ? 1 : b[0] === NO_DEPT ? -1 : b[1].length - a[1].length);

  return (
    <div className="flex items-start gap-5 overflow-x-auto pb-2">
      {ordered.map(([dept, items], laneIdx) => {
        const tone = toneAt(laneIdx);
        const people = items.reduce((n, p) => n + (p.assigned_persons_count ?? 0), 0);
        return (
          <section key={dept} className="flex-1 min-w-[320px] max-w-[420px] rounded-2xl border p-3"
                   style={{ backgroundColor: `color-mix(in srgb, ${tone.mark} 6%, var(--card))`, borderColor: `color-mix(in srgb, ${tone.mark} 22%, var(--card))` }}>
            <div className="flex items-center gap-3 px-2 pt-1 pb-3">
              <span className="w-9 h-9 rounded-xl grid place-items-center" style={{ color: tone.ink, backgroundColor: tone.bg }}>
                <Building2 className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="font-extrabold text-foreground truncate">{dept}</h2>
                <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {items.length} vị trí · {people} người
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((p) => {
                const n = p.assigned_persons_count ?? 0;
                const reqs = reqCount(p);
                const flagged = p.status !== "active";
                return (
                  <article key={p.id} onClick={() => onOpen(p)}
                           style={{ borderTopColor: tone.mark }}
                           className="group rounded-xl bg-card border border-border border-t-[3px] p-4 cursor-pointer transition-shadow shadow-[0_1px_6px_color-mix(in_srgb,var(--primary)_6%,transparent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)]">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                      {flagged && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ color: POSITION_STATUSES[p.status].color, backgroundColor: `color-mix(in srgb, ${POSITION_STATUSES[p.status].color} 14%, transparent)` }}>
                          <AlertTriangle className="w-3 h-3" />{POSITION_STATUSES[p.status].label}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <LevelLadder level={p.target_level} color={tone.mark} />
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${reqs ? "text-muted-foreground" : "text-warning"}`}>
                        <ListChecks className="w-3.5 h-3.5" />{reqs ? `${reqs} kỹ năng` : "Chưa có chuẩn"}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: Math.min(n, 12) }, (_, i) => (
                          <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tone.mark }} />
                        ))}
                        {n === 0 && <span className="w-2.5 h-2.5 rounded-full border border-dashed border-muted-foreground" />}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {n ? `${n} người đảm nhận` : "Chưa ai đảm nhận"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

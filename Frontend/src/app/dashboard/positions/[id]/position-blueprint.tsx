"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";
import ChartFrame from "@/components/charts/chart-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { toneAt } from "@/lib/ui/tones";
import type { SkillRequirement } from "@/app/dashboard/management-types";

interface Person { id: string; full_name: string }

/** Bản thiết kế vị trí: mỗi yêu cầu một hàng, vạch = level cần đạt, chấm = từng người đang giữ vị trí. */
export default function PositionBlueprint({ persons, requirements }: { persons: Person[]; requirements: SkillRequirement[] }) {
  // levels[personId][skillId] = current_level
  const [levels, setLevels] = useState<Record<string, Record<string, number>> | null>(persons.length ? null : {});
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!persons.length) return;
    Promise.all(persons.map(async (p) => {
      try {
        const res = await fetch(`/api/person-skills?person_id=${p.id}`);
        const { person_skills } = res.ok ? await res.json() : { person_skills: [] };
        return [p.id, Object.fromEntries((person_skills ?? []).map((s: { skill_id: string; current_level: number }) => [s.skill_id, s.current_level]))] as const;
      } catch { return [p.id, {}] as const; }
    })).then((rows) => setLevels(Object.fromEntries(rows)));
  }, [persons]);

  const colorOf = (i: number) => toneAt(i);
  const scale = Math.max(5, ...requirements.map((r) => r.required_level));
  const pos = (lvl: number) => `${(lvl / scale) * 100}%`;
  const ready = (pid: string) => requirements.filter((r) => (levels?.[pid]?.[r.skill_id] ?? 0) >= r.required_level).length;

  return (
    <ChartFrame
      title="Bản thiết kế vị trí"
      subtitle="Vạch đứng là level cần đạt; mỗi chấm là một người đang giữ vị trí, đặt ở level hiện tại của họ"
      tag={{ label: `${requirements.length} yêu cầu · ${persons.length} người`, tone: "violet" }}
      empty={requirements.length === 0}
      emptyLabel="Vị trí chưa có yêu cầu kỹ năng — thêm ở tab Chỉnh yêu cầu"
    >
      {persons.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {persons.map((p, i) => {
            const on = hover === p.id;
            return (
              <Link key={p.id} href={`/dashboard/persons/${p.id}`}
                    onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold transition-shadow"
                    style={{ color: colorOf(i).ink, backgroundColor: colorOf(i).bg, boxShadow: on ? `0 0 0 2px ${colorOf(i).mark}` : undefined }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorOf(i).mark }} />
                {p.full_name}
                {levels && <span className="tabular-nums opacity-70">{ready(p.id)}/{requirements.length}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {!levels ? <Skeleton className="h-64 rounded-xl" /> : (
        <div>
          <div className="grid grid-cols-[220px_1fr_90px] gap-5 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Kỹ năng</span>
            <div className="relative h-4">
              {Array.from({ length: scale + 1 }, (_, l) => (
                <span key={l} className="absolute -translate-x-1/2 tabular-nums" style={{ left: pos(l) }}>{l}</span>
              ))}
            </div>
            <span className="text-right">Đạt</span>
          </div>
          <ul className="divide-y divide-border">
            {requirements.map((r) => {
              const met = persons.filter((p) => (levels[p.id]?.[r.skill_id] ?? 0) >= r.required_level).length;
              const all = persons.length > 0 && met === persons.length;
              const color = all ? "var(--success)" : r.is_mandatory ? "var(--danger)" : "var(--warning)";
              return (
                <li key={r.id} className="grid grid-cols-[220px_1fr_90px] items-center gap-5 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-foreground truncate">
                      {r.is_mandatory && <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-danger" aria-label="Bắt buộc" />}
                      {r.skills.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Cần level {r.required_level}{r.is_mandatory ? " · bắt buộc" : ""}</p>
                  </div>
                  <div className="relative h-8">
                    <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
                    <span className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-25" style={{ left: pos(r.required_level), right: 0, backgroundColor: "var(--success)" }} />
                    <span className="absolute top-0 bottom-0 w-0.5 rounded-full bg-foreground/70" style={{ left: pos(r.required_level) }} />
                    {persons.map((p, i) => {
                      const lvl = levels[p.id]?.[r.skill_id] ?? 0;
                      // Người trùng level xếp lệch dọc nhẹ để không che nhau.
                      const same = persons.slice(0, i).filter((q) => (levels[q.id]?.[r.skill_id] ?? 0) === lvl).length;
                      const dim = hover !== null && hover !== p.id;
                      return (
                        <span key={p.id} title={`${p.full_name}: level ${lvl}`}
                              className="absolute w-3.5 h-3.5 -translate-x-1/2 rounded-full ring-2 ring-card transition-opacity"
                              style={{ left: pos(lvl), top: `calc(50% - 7px + ${(same % 3 - 1) * 7}px)`, backgroundColor: colorOf(i).mark, opacity: dim ? 0.2 : 1 }} />
                      );
                    })}
                  </div>
                  <div className="text-right">
                    {persons.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, var(--card))` }}>
                        {met}/{persons.length}
                      </span>
                    ) : <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Users className="w-3 h-3" />—</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </ChartFrame>
  );
}

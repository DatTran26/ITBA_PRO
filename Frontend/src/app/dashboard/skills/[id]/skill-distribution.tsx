"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import ChartFrame from "@/components/charts/chart-frame";
import { flowAt, toneFor, toneAt } from "@/lib/ui/tones";
import type { SkillDetail } from "@/app/dashboard/management-types";

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

/** Mỗi cột một level, trong cột là chính những người đang ở level đó; cờ trên đầu = vị trí yêu cầu level ấy. */
export default function SkillDistribution({ skill }: { skill: SkillDetail }) {
  const people = skill.person_skills;
  const reqs = skill.position_requirements;
  const maxLevel = Math.max(5, ...people.map((p) => p.current_level), ...reqs.map((r) => r.required_level));
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);
  const tallest = Math.max(1, ...levels.map((l) => people.filter((p) => p.current_level === l).length));
  const PER_COL = 12;

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5 mb-6 items-start">
      <ChartFrame
        title="Ai đang ở level nào"
        subtitle="Mỗi cột là một level; cờ phía trên là vị trí cần đạt level đó"
        tag={{ label: `${people.length} người`, tone: "violet" }}
        empty={people.length === 0}
        emptyLabel="Chưa ai được ghi nhận kỹ năng này"
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${maxLevel}, minmax(0,1fr))` }}>
          {levels.map((l, i) => {
            const here = people.filter((p) => p.current_level === l).sort((a, b) => a.person_name.localeCompare(b.person_name));
            const flags = reqs.filter((r) => r.required_level === l);
            const c = flowAt(i, maxLevel);
            return (
              <div key={l} className="flex flex-col">
                <div className="min-h-14 flex flex-col justify-end gap-1 pb-2">
                  {flags.map((r) => (
                    <Link key={r.position_id} href={`/dashboard/positions/${r.position_id}`} title={`${r.position_title} cần level ${l}`}
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold truncate hover:opacity-80"
                          style={{ color: toneFor(r.position_title).ink, backgroundColor: toneFor(r.position_title).bg }}>
                      <Flag className="w-3 h-3 shrink-0" /><span className="truncate">{r.position_title}</span>
                    </Link>
                  ))}
                </div>
                <div className="rounded-xl p-2 flex flex-wrap content-end gap-1 justify-center"
                     style={{ minHeight: 40 + Math.ceil(tallest / 3) * 34, backgroundColor: `color-mix(in srgb, ${c} 10%, var(--card))` }}>
                  {here.slice(0, PER_COL).map((p) => {
                    const t = toneFor(p.person_name);
                    return (
                      <Link key={p.person_id} href={`/dashboard/persons/${p.person_id}`} title={p.person_name}
                            className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold ring-2 ring-card hover:scale-110 transition-transform"
                            style={{ color: t.ink, backgroundColor: t.bg }}>
                        {initials(p.person_name)}
                      </Link>
                    );
                  })}
                  {here.length > PER_COL && (
                    <span className="w-8 h-8 rounded-full grid place-items-center text-[10px] font-bold bg-card text-muted-foreground">+{here.length - PER_COL}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-white" style={{ backgroundColor: c }}>
                  <span className="text-xs font-black">Level {l}</span>
                  <span className="text-sm font-black tabular-nums">{here.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ChartFrame>

      <ChartFrame title="Đáp ứng theo vị trí" subtitle="Số người đạt level mà từng vị trí yêu cầu"
                  tag={{ label: `${reqs.length} vị trí`, tone: "orange" }}
                  empty={reqs.length === 0} emptyLabel="Chưa vị trí nào yêu cầu kỹ năng này">
        <ul className="space-y-4">
          {[...reqs].sort((a, b) => b.required_level - a.required_level).map((r, i) => {
            const meets = people.filter((p) => p.current_level >= r.required_level).length;
            const pct = people.length ? (meets / people.length) * 100 : 0;
            const t = toneAt(i);
            return (
              <li key={r.position_id}>
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/dashboard/positions/${r.position_id}`} className="text-sm font-bold text-foreground truncate hover:text-primary">{r.position_title}</Link>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>
                    ≥ L{r.required_level}{r.is_mandatory ? " · bắt buộc" : ""}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.mark }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  <span className="font-bold text-foreground">{meets}</span>/{people.length} người đạt{r.department ? ` · ${r.department}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </ChartFrame>
    </div>
  );
}

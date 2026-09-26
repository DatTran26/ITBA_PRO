"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EyeOff } from "lucide-react";
import ChartFrame from "@/components/charts/chart-frame";
import { flowAt, toneFor } from "@/lib/ui/tones";
import type { GroupMemberItem } from "@/app/dashboard/management-types";

const MAX_LEVEL = 5;
const levelColor = (l: number) => flowAt(Math.min(l, MAX_LEVEL) - 1, MAX_LEVEL);

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

/** Ma trận thành viên × kỹ năng: ô màu = level (cùng dải với trang kỹ năng), ô trống = điểm mù của nhóm. */
export default function GroupSkillHeatmap({ members }: { members: GroupMemberItem[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const { skills, grid } = useMemo(() => {
    const freq = new Map<string, number>();
    const grid = new Map<string, Map<string, number>>();
    for (const m of members) {
      const row = new Map<string, number>();
      for (const ps of m.persons.person_skills ?? []) {
        if (!ps.skills?.name) continue;
        row.set(ps.skills.name, ps.current_level);
        freq.set(ps.skills.name, (freq.get(ps.skills.name) ?? 0) + 1);
      }
      grid.set(m.id, row);
    }
    return { skills: [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])), grid };
  }, [members]);

  const blind = skills.filter(([, n]) => n / members.length < 0.5);
  const cols = `190px repeat(${skills.length}, 38px)`;

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5 mb-6 items-start">
      <ChartFrame
        title="Bản đồ kỹ năng của nhóm"
        subtitle="Mỗi hàng một thành viên, mỗi cột một kỹ năng; màu càng đậm level càng cao, ô trống là chưa có"
        tag={{ label: `${members.length} người × ${skills.length} kỹ năng`, tone: "violet" }}
        empty={members.length === 0 || skills.length === 0}
        emptyLabel={members.length === 0 ? "Nhóm chưa có thành viên" : "Thành viên chưa được ghi nhận kỹ năng"}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-max">
            <div className="grid items-end gap-1 pb-2" style={{ gridTemplateColumns: cols }}>
              <span />
              {skills.map(([name]) => (
                <div key={name} className="relative h-24">
                  <span className={`absolute bottom-1 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap text-xs font-semibold ${hover === name ? "text-primary" : "text-foreground"}`}>{name}</span>
                </div>
              ))}
            </div>
            {members.map((m) => {
              const row = grid.get(m.id)!;
              const t = toneFor(m.persons.full_name);
              return (
                <div key={m.id} className="grid items-center gap-1 py-0.5" style={{ gridTemplateColumns: cols }}>
                  <Link href={`/dashboard/persons/${m.person_id}`} className="flex items-center gap-2 min-w-0 pr-2 group">
                    <span className="w-7 h-7 shrink-0 rounded-full grid place-items-center text-[10px] font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>
                      {initials(m.persons.full_name)}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary">{m.persons.full_name}</span>
                  </Link>
                  {skills.map(([name]) => {
                    const lvl = row.get(name);
                    return (
                      <span key={name} title={`${m.persons.full_name} · ${name}: ${lvl ? `level ${lvl}` : "chưa có"}`}
                            onMouseEnter={() => setHover(name)} onMouseLeave={() => setHover(null)}
                            className={`h-9 rounded-md grid place-items-center text-xs font-black tabular-nums ${lvl ? "text-white" : "border border-dashed border-border"}`}
                            style={lvl ? { backgroundColor: levelColor(lvl) } : undefined}>
                        {lvl ?? ""}
                      </span>
                    );
                  })}
                </div>
              );
            })}
            <div className="grid items-center gap-1 pt-2 mt-1 border-t border-border" style={{ gridTemplateColumns: cols }}>
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Độ phủ</span>
              {skills.map(([name, n]) => (
                <span key={name} className={`text-center text-[11px] font-bold tabular-nums ${n / members.length < 0.5 ? "text-danger" : "text-muted-foreground"}`}>
                  {Math.round((n / members.length) * 100)}%
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          Level
          {Array.from({ length: MAX_LEVEL }, (_, i) => (
            <span key={i} className="w-6 h-4 rounded grid place-items-center text-[10px] font-black text-white" style={{ backgroundColor: levelColor(i + 1) }}>{i + 1}</span>
          ))}
          <span className="ml-2 w-6 h-4 rounded border border-dashed border-border" /> chưa có
        </div>
      </ChartFrame>

      <ChartFrame title="Điểm mù" subtitle="Kỹ năng dưới một nửa nhóm có"
                  tag={{ label: `${blind.length} kỹ năng`, tone: blind.length ? "orange" : "teal" }}
                  empty={blind.length === 0} emptyLabel="Nhóm phủ đều các kỹ năng">
        <ul className="space-y-3">
          {blind.map(([name, n]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="w-8 h-8 shrink-0 rounded-lg grid place-items-center bg-danger/10 text-danger"><EyeOff className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{name}</p>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <span className="block h-full rounded-full bg-danger" style={{ width: `${(n / members.length) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold tabular-nums text-muted-foreground">{n}/{members.length}</span>
            </li>
          ))}
        </ul>
      </ChartFrame>
    </div>
  );
}

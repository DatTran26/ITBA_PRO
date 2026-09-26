"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChartFrame from "@/components/charts/chart-frame";
import { categoryTone } from "./skills-list-client";
import type { SkillListItem } from "@/app/dashboard/management-types";

type Zone = "short" | "ok" | "unmapped";

const ZONES: Record<Zone, { label: string; color: string }> = {
  short: { label: "Thiếu người", color: "var(--danger)" },
  ok: { label: "Đủ người", color: "var(--primary)" },
  unmapped: { label: "Chưa gắn vị trí", color: "var(--muted-foreground)" },
};

function zoneOf(s: SkillListItem): Zone {
  if (s.position_count === 0) return "unmapped";
  return s.person_count < s.position_count ? "short" : "ok";
}

interface Bubble {
  key: string;
  x: number;
  y: number;
  zone: Zone;
  skills: SkillListItem[];
}

/** Bản đồ cung–cầu: x = số vị trí yêu cầu, y = số người có kỹ năng.
 *  Đường chéo y = x; nằm dưới đường = thiếu người. Kỹ năng trùng toạ độ gom
 *  thành một bong bóng (dữ liệu là số đếm nguyên nhỏ nên trùng rất nhiều). */
export default function SupplyDemandMap({
  skills, selectedKey, onSelect, categoryOrder,
}: {
  skills: SkillListItem[];
  categoryOrder: string[];
  selectedKey: string | null;
  onSelect: (key: string | null, ids: string[]) => void;
}) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);

  const bubbles = useMemo(() => {
    const map = new Map<string, Bubble>();
    for (const s of skills) {
      const key = `${s.position_count}|${s.person_count}`;
      const b = map.get(key) ?? { key, x: s.position_count, y: s.person_count, zone: zoneOf(s), skills: [] };
      b.skills.push(s);
      map.set(key, b);
    }
    return [...map.values()];
  }, [skills]);

  const maxX = Math.max(1, ...skills.map((s) => s.position_count));
  const maxY = Math.max(1, ...skills.map((s) => s.person_count));
  // % trong vùng vẽ, chừa 6% mép để bong bóng ở 0 và ở max không bị cắt.
  const px = (v: number) => 6 + (v / maxX) * 88;
  const py = (v: number) => 94 - (v / maxY) * 88;
  const diag = Math.min(maxX, maxY);

  const counts = useMemo(() => {
    const c: Record<Zone, number> = { short: 0, ok: 0, unmapped: 0 };
    for (const s of skills) c[zoneOf(s)]++;
    return c;
  }, [skills]);

  // Mỏng nhất = ít người trên mỗi vị trí cần; luôn có dữ liệu kể cả khi không kỹ năng nào thiếu.
  const thinnest = useMemo(() => skills
    .filter((s) => s.position_count > 0)
    .map((s) => ({ ...s, ratio: s.person_count / s.position_count }))
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 6), [skills]);
  const maxRatio = Math.max(1, ...thinnest.map((s) => s.ratio));
  const xTicks = maxX <= 10 ? Array.from({ length: maxX + 1 }, (_, i) => i) : [0, maxX];

  const active = bubbles.find((b) => b.key === hover);

  /* Bong bóng tô theo tỉ lệ nhóm kỹ năng bên trong (conic); vùng "chưa gắn" giữ xám. */
  const pie = (b: Bubble) => {
    if (b.zone === "unmapped") return ZONES.unmapped.color;
    const n = b.skills.length;
    let acc = 0;
    const segs = [...b.skills].sort((x, y) => (x.category ?? "").localeCompare(y.category ?? "")).map((sk) => {
      const c = categoryTone(sk.category, categoryOrder).mark;
      const seg = `${c} ${(acc / n) * 360}deg ${((acc + 1) / n) * 360}deg`;
      acc++;
      return seg;
    });
    return `conic-gradient(${segs.join(",")})`;
  };
  const presentCats = categoryOrder.filter((c) => skills.some((s) => s.category === c));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      <ChartFrame
        className="lg:col-span-2"
        title="Bản đồ cung – cầu kỹ năng"
        subtitle="Mỗi bong bóng là các kỹ năng cùng số vị trí cần và số người có. Bấm để lọc danh sách."
        empty={skills.length === 0}
        aside={
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
              {presentCats.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryTone(c, categoryOrder).mark }} />{c}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-x-3 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full ring-2 ring-danger" />{ZONES.short.label} <b className="tabular-nums text-foreground">{counts.short}</b></span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONES.unmapped.color }} />{ZONES.unmapped.label} <b className="tabular-nums text-foreground">{counts.unmapped}</b></span>
            </div>
          </div>
        }
      >
        <div className="flex gap-2">
          <div className="flex items-center">
            <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
              Số người có kỹ năng →
            </span>
          </div>
          <div className="flex-1 min-w-0 pl-4">
            <div className="relative h-[280px] sm:h-[320px]" onMouseLeave={() => setHover(null)}>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                {/* Vùng thiếu người: dưới đường chéo. */}
                <polygon
                  points={`${px(0)},${py(0)} ${px(maxX)},${py(0)} ${px(maxX)},${py(Math.min(maxX, maxY))} ${px(diag)},${py(diag)}`}
                  fill="var(--danger)" fillOpacity={0.06}
                />
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={6} x2={94} y1={94 - f * 88} y2={94 - f * 88} stroke="var(--border)"
                        strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                ))}
                <line x1={6} x2={94} y1={94} y2={94} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
                <line x1={6} x2={6} y1={6} y2={94} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
                <line x1={px(0)} y1={py(0)} x2={px(diag)} y2={py(diag)} stroke="var(--muted-foreground)"
                      strokeOpacity={0.5} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
              </svg>

              <span className="absolute left-0 -translate-x-full pr-1 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground tabular-nums" style={{ top: `${py(maxY)}%` }}>{maxY}</span>
              <span className="absolute left-0 -translate-x-full pr-1 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground tabular-nums" style={{ top: `${py(0)}%` }}>0</span>
              <span className="absolute right-2 bottom-3 text-[10px] font-bold uppercase tracking-wide text-danger/80">
                Thiếu người
              </span>
              <span className="absolute left-[8%] top-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
                Dư nguồn lực
              </span>

              {bubbles.map((b) => {
                const n = b.skills.length;
                const size = Math.min(40, 12 + Math.sqrt(n) * 7);
                const on = selectedKey === b.key;
                const dim = selectedKey !== null && !on;
                return (
                  <button
                    key={b.key}
                    type="button"
                    aria-label={`${n} kỹ năng: cần ${b.x} vị trí, có ${b.y} người`}
                    aria-pressed={on}
                    onMouseEnter={() => setHover(b.key)}
                    onFocus={() => setHover(b.key)}
                    onClick={() => onSelect(on ? null : b.key, b.skills.map((s) => s.id))}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center text-[10px] font-bold text-white tabular-nums transition-all duration-150 ring-2 ring-card hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
                    style={{
                      left: `${px(b.x)}%`, top: `${py(b.y)}%`, width: size, height: size,
                      background: pie(b),
                      opacity: dim ? 0.3 : 1,
                      textShadow: "0 1px 2px rgb(0 0 0 / 0.45)",
                      boxShadow: [b.zone === "short" ? "0 0 0 4px var(--danger)" : "", on ? "0 0 0 7px color-mix(in srgb, var(--primary) 30%, transparent)" : ""].filter(Boolean).join(",") || undefined,
                    }}
                  >
                    {n > 1 ? n : ""}
                  </button>
                );
              })}

              {active && (
                <div
                  className="absolute z-10 pointer-events-none w-56 rounded-xl border border-border bg-card p-3 shadow-lg text-xs"
                  style={{
                    left: `${Math.min(px(active.x), 70)}%`,
                    top: `${py(active.y)}%`,
                    transform: `translate(${px(active.x) > 70 ? "-40%" : "12px"}, ${py(active.y) < 40 ? "12px" : "calc(-100% - 12px)"})`,
                  }}
                >
                  <p className="font-bold text-foreground">
                    Cần {active.x} vị trí · Có {active.y} người
                  </p>
                  <p className="mt-0.5 font-semibold" style={{ color: ZONES[active.zone].color }}>
                    {ZONES[active.zone].label}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-muted-foreground">
                    {active.skills.slice(0, 5).map((s) => <li key={s.id} className="truncate">{s.name}</li>)}
                    {active.skills.length > 5 && <li>+{active.skills.length - 5} kỹ năng khác</li>}
                  </ul>
                </div>
              )}
            </div>
            <div className="relative h-4 mt-1 text-[10px] font-semibold text-muted-foreground tabular-nums">
              {xTicks.map((t) => (
                <span key={t} className="absolute -translate-x-1/2" style={{ left: `${px(t)}%` }}>{t}</span>
              ))}
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-muted-foreground">Số vị trí yêu cầu →</p>
          </div>
        </div>
      </ChartFrame>

      <ChartFrame
        title="Mỏng nhất"
        subtitle="Số người có trên mỗi vị trí cần — thấp nhất trước"
        tag={counts.short ? { label: `${counts.short} thiếu người`, tone: "orange" } : { label: "Không thiếu", tone: "teal" }}
        empty={thinnest.length === 0}
        emptyLabel="Chưa kỹ năng nào gắn vào vị trí"
      >
        <ol className="space-y-3.5">
          {thinnest.map((s, i) => {
            const short = s.ratio < 1;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/skills/${s.id}`)}
                  className="w-full text-left group cursor-pointer"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      <span className="w-6 h-6 shrink-0 rounded-lg grid place-items-center text-[11px] font-black tabular-nums"
                            style={{ color: categoryTone(s.category, categoryOrder).ink, backgroundColor: categoryTone(s.category, categoryOrder).bg }}>{i + 1}</span>
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${short ? "text-danger" : "text-foreground"}`}>
                      {s.ratio.toFixed(1)}×
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.ratio / maxRatio) * 100}%`, backgroundColor: short ? "var(--danger)" : categoryTone(s.category, categoryOrder).mark }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                    {s.category ?? "Chưa phân nhóm"} · {s.person_count} người / {s.position_count} vị trí{short ? " · thiếu người" : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      </ChartFrame>
    </div>
  );
}

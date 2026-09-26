"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ChartFrame } from "@/components/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { toneFor } from "@/lib/ui/tones";
import type { PersonSkillItem, SkillRequirement } from "@/app/dashboard/management-types";

interface Props {
  personId: string;
  skills: PersonSkillItem[];
  positionId: string | null;
}

export default function PersonSkillsTab({ skills, positionId }: Props) {
  const [requirements, setRequirements] = useState<SkillRequirement[]>([]);
  const [loaded, setLoaded] = useState(!positionId);

  useEffect(() => {
    if (!positionId) return;
    fetch(`/api/positions/${positionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.position?.position_skill_requirements) {
          setRequirements(data.position.position_skill_requirements);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [positionId]);

  const skillMap = new Map(skills.map((s) => [s.skill_id, s]));
  const rows = requirements.map((req) => {
    const current = skillMap.get(req.skill_id)?.current_level ?? 0;
    return { req, current, met: current >= req.required_level };
  });
  const metCount = rows.filter((r) => r.met).length;
  // Thang chung cho mọi thanh để so được giữa các dòng (level 1-5 là chuẩn, nới nếu có số lớn hơn).
  const scale = Math.max(5, ...rows.map((r) => Math.max(r.current, r.req.required_level)));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartFrame
        title="Kỹ năng hiện có"
        subtitle="Level đã ghi nhận"
        tag={{ label: `${skills.length} kỹ năng`, tone: "violet" }}
        empty={skills.length === 0}
        emptyLabel="Chưa ghi nhận kỹ năng"
      >
        <ul className="divide-y divide-border">
          {skills.map((s) => {
            const t = toneFor(s.skills.category ?? s.skills.name);
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.skills.name}</p>
                  {s.skills.category && <p className="text-xs text-muted-foreground">{s.skills.category}</p>}
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: t.ink, backgroundColor: t.bg }}>
                  Level {s.current_level}
                </span>
              </li>
            );
          })}
        </ul>
      </ChartFrame>

      {!positionId ? (
        <ChartFrame title="Khoảng cách với vị trí" subtitle="So với yêu cầu của vị trí" empty emptyLabel="Gán vị trí để xem phân tích khoảng cách kỹ năng">
          {null}
        </ChartFrame>
      ) : !loaded ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <ChartFrame
          title="Khoảng cách với vị trí"
          subtitle="Level hiện tại so với yêu cầu, vạch đứng là mức cần đạt"
          tag={{ label: `Đạt ${metCount}/${rows.length}`, tone: metCount === rows.length ? "teal" : "orange" }}
          empty={rows.length === 0}
          emptyLabel="Vị trí này chưa định nghĩa yêu cầu kỹ năng"
        >
          <ul className="space-y-3.5">
            {rows.map(({ req, current, met }) => {
              const color = met ? "var(--success)" : req.is_mandatory ? "var(--danger)" : "var(--warning)";
              const Icon = met ? CheckCircle2 : req.is_mandatory ? XCircle : AlertCircle;
              return (
                <li key={req.id} title={`${req.skills.name}: ${current}/${req.required_level}`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                      <span className="text-sm font-semibold text-foreground truncate">{req.skills.name}</span>
                      {req.is_mandatory && (
                        <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">Bắt buộc</span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">
                      {current}<span className="text-muted-foreground"> / {req.required_level}</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-muted">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ width: `${(current / scale) * 100}%`, backgroundColor: color }}
                    />
                    <span
                      aria-hidden
                      className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground/60"
                      style={{ left: `calc(${(req.required_level / scale) * 100}% - 1px)` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </ChartFrame>
      )}
    </div>
  );
}

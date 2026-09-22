"use client";

import Link from "next/link";
import { AlertTriangle, Building2, FolderKanban } from "lucide-react";
import { ChartFrame, HBarList, TrendArea } from "@/components/charts";
import { toneFor } from "@/lib/ui/tones";
import type { PersonDetail, PersonSkillItem } from "@/app/dashboard/management-types";

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface ResultRow {
  id: string;
  score: number;
  total_questions: number;
  submitted_at: string;
}

interface Props {
  person: PersonDetail;
  skills: PersonSkillItem[];
  memberships: MembershipRow[];
  results: ResultRow[];
}

export default function PersonOverviewTab({ person, skills, memberships, results }: Props) {
  const warnings: string[] = [];
  if (!person.position_id) warnings.push("Chưa gán vị trí");
  if (skills.length === 0) warnings.push("Chưa ghi nhận kỹ năng");
  if (memberships.length === 0) warnings.push("Chưa thuộc nhóm nào");

  const skillLevels = skills.map((s) => ({ label: s.skills.name, value: s.current_level }));
  // Kết quả đến từ page.tsx theo thứ tự mới nhất trước; đảo lại để đường đi từ cũ đến mới.
  const scoreTrend = [...results]
    .filter((r) => r.total_questions > 0)
    .reverse()
    .map((r) => ({
      label: new Date(r.submitted_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      value: Math.round((r.score / r.total_questions) * 100),
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {warnings.length > 0 && (
        <div role="status" className="lg:col-span-2 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-danger">Cần bổ sung thông tin</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{warnings.join(" · ")}</p>
          </div>
        </div>
      )}

      <HBarList
        title="Cấp độ kỹ năng"
        subtitle="Level hiện tại của từng kỹ năng"
        tag={{ label: `${skills.length} kỹ năng`, tone: "violet" }}
        items={skillLevels}
        max={8}
      />

      <TrendArea
        title="Điểm đánh giá"
        subtitle="Tỉ lệ đúng qua các bài test, cũ đến mới"
        tag={{ label: `${scoreTrend.length} bài`, tone: "teal" }}
        points={scoreTrend}
        valueSuffix="%"
      />

      <ChartFrame title="Vị trí" subtitle="Vai trò và cấp độ hiện tại" tag={{ label: "Position" }}>
        {person.positions ? (
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground truncate">{person.positions.title}</p>
              <p className="text-xs text-muted-foreground">
                {person.positions.department ?? "Chưa gán phòng ban"}
                {person.current_level && <> · Level {person.current_level}</>}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Chưa gán vị trí</p>
        )}
      </ChartFrame>

      <ChartFrame title="Nhóm" subtitle="Nhóm đang tham gia" tag={{ label: `${memberships.length} nhóm`, tone: "orange" }}>
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa thuộc nhóm nào</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberships.map((m) => {
              if (!m.groups) return null;
              const t = toneFor(m.groups.name);
              return (
                <Link
                  key={m.id}
                  href={`/dashboard/groups/${m.groups.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ color: t.ink, backgroundColor: t.bg }}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  {m.groups.name}
                </Link>
              );
            })}
          </div>
        )}
      </ChartFrame>
    </div>
  );
}

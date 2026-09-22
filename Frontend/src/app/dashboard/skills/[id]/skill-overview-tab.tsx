"use client";

import { ChartFrame, DonutStat, HBarList, colorAt } from "@/components/charts";
import type { SkillDetail } from "@/app/dashboard/management-types";

interface Props {
  skill: SkillDetail;
}

export default function SkillOverviewTab({ skill }: Props) {
  const reqs = skill.position_requirements;
  const people = skill.person_skills;

  // Level 1-5 cố định thứ tự để màu đi theo level, không theo số lượng.
  const maxLevel = Math.max(5, ...people.map((p) => p.current_level));
  const byLevel = Array.from({ length: maxLevel }, (_, i) => ({
    label: `Level ${i + 1}`,
    value: people.filter((p) => p.current_level === i + 1).length,
    color: colorAt(Math.min(i, 5)),
  })).filter((s) => s.value > 0);

  const reqByPosition = reqs.map((r) => ({ label: r.position_title, value: r.required_level }));

  // Đáp ứng = số người đạt level yêu cầu cao nhất trong các vị trí đang cần kỹ năng này.
  const topReq = reqs.length ? Math.max(...reqs.map((r) => r.required_level)) : 0;
  const meets = people.filter((p) => p.current_level >= topReq).length;
  const coverage = [
    { label: `Đạt level ${topReq}+`, value: meets, color: "var(--success)" },
    { label: "Chưa đạt", value: people.length - meets, color: "var(--warning)" },
  ].filter((s) => s.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DonutStat
        title="Phân bố level"
        subtitle="Level của những người đang có kỹ năng"
        tag={{ label: `${people.length} người`, tone: "violet" }}
        slices={byLevel}
        centerLabel="Người"
      />

      <HBarList
        title="Level vị trí yêu cầu"
        subtitle="Mức cần đạt ở từng vị trí"
        tag={{ label: `${reqs.length} vị trí`, tone: "orange" }}
        items={reqByPosition}
        max={8}
      />

      <DonutStat
        title="Mức đáp ứng"
        subtitle={topReq ? `So với yêu cầu cao nhất (level ${topReq})` : "Chưa có vị trí yêu cầu"}
        tag={{ label: "Cung và cầu", tone: "teal" }}
        slices={reqs.length ? coverage : []}
        centerLabel="Người"
      />

      <ChartFrame title="Thông tin kỹ năng" subtitle="Danh mục và mô tả" tag={{ label: "Skill" }}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-xs font-bold text-muted-foreground">Danh mục</dt><dd className="mt-1 font-semibold text-foreground">{skill.category || "-"}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-semibold text-foreground">{new Date(skill.created_at).toLocaleDateString("vi-VN")}</dd></div>
        </dl>
        <p className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground leading-relaxed">
          {skill.description || "Chưa có mô tả."}
        </p>
      </ChartFrame>
    </div>
  );
}

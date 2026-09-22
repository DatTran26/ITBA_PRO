"use client";

import { AlertTriangle } from "lucide-react";
import TagChips from "@/components/crm/tag-chips";
import { ChartFrame, DonutStat, HBarList, colorAt } from "@/components/charts";
import type { PositionDetail, SkillRequirement, TagItem } from "@/app/dashboard/management-types";

interface Props {
  position: PositionDetail;
  requirements: SkillRequirement[];
  personLevels: (string | null)[];
  tags: TagItem[];
}

export default function PositionOverviewTab({ position, requirements, personLevels, tags }: Props) {
  const warnings: string[] = [];
  if (requirements.length === 0) warnings.push("Chưa định nghĩa yêu cầu kỹ năng");
  if (personLevels.length === 0) warnings.push("Chưa gán người vào vị trí");

  const reqLevels = requirements.map((r) => ({ label: r.skills.name, value: r.required_level }));
  const mandatory = requirements.filter((r) => r.is_mandatory).length;
  const bySkillType = [
    { label: "Bắt buộc", value: mandatory, color: colorAt(0) },
    { label: "Tuỳ chọn", value: requirements.length - mandatory, color: colorAt(2) },
  ].filter((s) => s.value > 0);
  // Thứ tự cố định để mỗi level luôn cùng màu giữa các vị trí; level lạ xếp sau.
  const LEVEL_ORDER = ["intern", "junior", "middle", "senior", "lead"];
  const levelCounts = personLevels.reduce((m, l) => m.set(l ?? "Chưa xác định", (m.get(l ?? "Chưa xác định") ?? 0) + 1), new Map<string, number>());
  const levelKeys = [...LEVEL_ORDER.filter((k) => levelCounts.has(k)), ...[...levelCounts.keys()].filter((k) => !LEVEL_ORDER.includes(k))];
  const byPersonLevel = levelKeys.map((label) => ({
    label, value: levelCounts.get(label)!, color: colorAt(LEVEL_ORDER.includes(label) ? LEVEL_ORDER.indexOf(label) : LEVEL_ORDER.length),
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
        title="Level yêu cầu"
        subtitle="Mức cần đạt cho từng kỹ năng"
        tag={{ label: `${requirements.length} kỹ năng`, tone: "violet" }}
        items={reqLevels}
        max={8}
      />

      <DonutStat
        title="Loại yêu cầu"
        subtitle="Bắt buộc và tuỳ chọn"
        tag={{ label: "Checklist" }}
        slices={bySkillType}
        centerLabel="Kỹ năng"
      />

      <DonutStat
        title="Cấp độ người được gán"
        subtitle="Level hiện tại của nhân sự trong vị trí"
        tag={{ label: `${personLevels.length} người`, tone: "orange" }}
        slices={byPersonLevel}
        centerLabel="Người"
      />

      <ChartFrame title="Thông tin vị trí" subtitle="Chi tiết và nhãn" tag={{ label: "Position", tone: "teal" }}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-xs font-bold text-muted-foreground">Phòng ban</dt><dd className="mt-1 font-semibold text-foreground">{position.department || "-"}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Level mục tiêu</dt><dd className="mt-1 font-semibold text-foreground">{position.target_level || "-"}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-semibold text-foreground">{new Date(position.created_at).toLocaleDateString("vi-VN")}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Cập nhật</dt><dd className="mt-1 font-semibold text-foreground">{new Date(position.updated_at).toLocaleDateString("vi-VN")}</dd></div>
        </dl>
        {tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <TagChips tags={tags} />
          </div>
        )}
      </ChartFrame>
    </div>
  );
}

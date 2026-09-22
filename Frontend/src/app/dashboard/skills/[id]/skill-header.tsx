"use client";

import { Pencil, FilePlus2, Zap, Briefcase, Users, CalendarDays } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import DetailHeader from "@/components/shares/detail-header";
import { toneFor } from "@/lib/ui/tones";
import type { SkillDetail } from "@/app/dashboard/management-types";

interface Props {
  skill: SkillDetail;
  onEdit: () => void;
  onCreateTest?: () => void;
}

export default function SkillHeader({ skill, onEdit, onCreateTest }: Props) {
  const positionCount = skill.position_requirements.length;
  const personCount = skill.person_skills.length;
  const shortageScore = Math.max(0, positionCount - personCount);
  const cat = toneFor(skill.category ?? "Uncategorized");

  return (
    <DetailHeader
      title={skill.name}
      avatarIcon={Zap}
      status={<>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: cat.ink, backgroundColor: cat.bg }}>
          {skill.category ?? "Uncategorized"}
        </span>
        {shortageScore > 0 && (
          <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-[11px] font-bold text-danger">Thiếu hụt {shortageScore}</span>
        )}
      </>}
      subtitle={skill.description ? <span className="line-clamp-2 max-w-2xl">{skill.description}</span> : undefined}
      actions={<>
        {onCreateTest && (
          <SharedDashboardButton variant="primary" size="sm" onClick={onCreateTest} leadingIcon={<FilePlus2 className="w-3.5 h-3.5" />}>
            Tạo bộ test
          </SharedDashboardButton>
        )}
        <SharedDashboardButton variant="secondary" size="sm" onClick={onEdit} leadingIcon={<Pencil className="w-3.5 h-3.5" />}>
          Edit
        </SharedDashboardButton>
      </>}
      info={[
        { icon: Briefcase, label: `${positionCount} vị trí yêu cầu` },
        { icon: Users, label: `${personCount} người có kỹ năng` },
        { icon: CalendarDays, label: `Tạo ${new Date(skill.created_at).toLocaleDateString("vi-VN")}` },
      ]}
    />
  );
}

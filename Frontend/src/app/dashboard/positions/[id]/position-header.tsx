"use client";

import { Pencil, Copy, Briefcase, Building2, Layers, ListChecks, Users, CalendarDays } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import DetailHeader, { type DetailInfoItem } from "@/components/shares/detail-header";
import StatusBadge from "@/components/crm/status-badge";
import TagChips from "@/components/crm/tag-chips";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import type { PositionDetail, TagItem } from "@/app/dashboard/management-types";

interface Props {
  position: PositionDetail;
  tags: TagItem[];
  assignedCount: number;
  reqCount: number;
  onEdit: () => void;
  onClone: () => void;
  onAddTag: () => void;
}

export default function PositionHeader({ position, tags, assignedCount, reqCount, onEdit, onClone, onAddTag }: Props) {
  const info: DetailInfoItem[] = [
    position.department && { icon: Building2, label: position.department },
    position.target_level && { icon: Layers, label: `Level ${position.target_level}` },
    { icon: ListChecks, label: `${reqCount} yêu cầu kỹ năng` },
    { icon: Users, label: `${assignedCount} người được gán` },
    { icon: CalendarDays, label: `Tạo ${new Date(position.created_at).toLocaleDateString("vi-VN")}` },
  ].filter(Boolean) as DetailInfoItem[];

  return (
    <DetailHeader
      title={position.title}
      avatarIcon={Briefcase}
      status={<StatusBadge status={position.status} config={POSITION_STATUSES} />}
      subtitle={position.description ? <span className="line-clamp-2 max-w-2xl">{position.description}</span> : undefined}
      tags={tags.length > 0 ? <TagChips tags={tags} onAdd={onAddTag} /> : undefined}
      actions={<>
        <SharedDashboardButton variant="secondary" size="sm" onClick={onClone} leadingIcon={<Copy className="w-3.5 h-3.5" />}>
          Clone
        </SharedDashboardButton>
        <SharedDashboardButton variant="secondary" size="sm" onClick={onEdit} leadingIcon={<Pencil className="w-3.5 h-3.5" />}>
          Edit
        </SharedDashboardButton>
      </>}
      info={info}
    />
  );
}

"use client";

import { Pencil, UserPlus, FolderKanban, Users, Tag, CalendarDays } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import DetailHeader from "@/components/shares/detail-header";
import StatusBadge from "@/components/crm/status-badge";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import type { GroupListItem } from "@/app/dashboard/management-types";

const TYPE_LABEL: Record<string, string> = {
  department: "Department", batch: "Batch", campaign: "Campaign", other: "Other",
};

interface Props {
  group: GroupListItem;
  memberCount: number;
  onEdit: () => void;
  onAddMember: () => void;
}

export default function GroupHeader({ group, memberCount, onEdit, onAddMember }: Props) {
  return (
    <DetailHeader
      title={group.name}
      avatarIcon={FolderKanban}
      status={<StatusBadge status={group.status} config={GROUP_STATUSES} />}
      subtitle={group.description ? <span className="line-clamp-2 max-w-2xl">{group.description}</span> : undefined}
      actions={<>
        <SharedDashboardButton variant="primary" size="sm" onClick={onAddMember} leadingIcon={<UserPlus className="w-3.5 h-3.5" />}>
          Add Member
        </SharedDashboardButton>
        <SharedDashboardButton variant="secondary" size="sm" onClick={onEdit} leadingIcon={<Pencil className="w-3.5 h-3.5" />}>
          Edit
        </SharedDashboardButton>
      </>}
      info={[
        { icon: Tag, label: TYPE_LABEL[group.type] ?? group.type },
        { icon: Users, label: `${memberCount} thành viên` },
        { icon: CalendarDays, label: `Tạo ${new Date(group.created_at).toLocaleDateString("vi-VN")}` },
      ]}
    />
  );
}

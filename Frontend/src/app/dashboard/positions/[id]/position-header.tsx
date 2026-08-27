"use client";

import { Pencil, Copy } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import { Badge } from "@/components/ui/badge";
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
  return (
    <div className="bg-[#1B253B] border border-[#8B99B0]/10 rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#ECF0F7]">{position.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={position.status} config={POSITION_STATUSES} />
            {position.department && (
              <Badge variant="outline" className="text-xs border-[#8B99B0]/20 text-[#8B99B0]">{position.department}</Badge>
            )}
            {position.target_level && (
              <Badge variant="outline" className="text-xs border-[#B48EFF]/30 text-[#B48EFF]">{position.target_level}</Badge>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-2">
              <TagChips tags={tags} onAdd={onAddTag} />
            </div>
          )}
        </div>

        <div className="flex gap-1.5 shrink-0">
          <SharedDashboardButton variant="outline" size="sm" onClick={onClone} className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7] gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Clone
          </SharedDashboardButton>
          <SharedDashboardButton variant="outline" size="sm" onClick={onEdit} className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7] gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </SharedDashboardButton>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#8B99B0]/10 text-sm text-[#8B99B0]">
        {position.description && <span className="text-[#5A6882] max-w-md truncate">{position.description}</span>}
        <span>{reqCount} skill requirement{reqCount !== 1 ? "s" : ""}</span>
        <span>{assignedCount} assigned person{assignedCount !== 1 ? "s" : ""}</span>
        <span>Created {new Date(position.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

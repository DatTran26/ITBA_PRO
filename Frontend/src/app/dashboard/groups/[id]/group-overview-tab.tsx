"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Tag } from "lucide-react";
import StatusBadge from "@/components/crm/status-badge";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import type { GroupListItem } from "@/app/dashboard/management-types";

const TYPE_COLORS: Record<string, string> = {
  department: "border-[#50FA7B]/30 text-[#50FA7B]",
  batch:      "border-[#8BE9FD]/30 text-[#8BE9FD]",
  campaign:   "border-[#FFB86C]/30 text-[#FFB86C]",
  other:      "border-[#8B99B0]/30 text-[#8B99B0]",
};

interface Props {
  group: GroupListItem;
  memberCount: number;
}

export default function GroupOverviewTab({ group, memberCount }: Props) {
  return (
    <div className="space-y-4">
      {/* Description */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-5">
        <h3 className="text-xs font-semibold text-[#5A6882] uppercase tracking-wide mb-3">Description</h3>
        {group.description ? (
          <p className="text-sm text-[#8B99B0] leading-relaxed">{group.description}</p>
        ) : (
          <p className="text-sm text-[#5A6882] italic">No description provided.</p>
        )}
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-3.5 h-3.5 text-[#5A6882]" />
            <span className="text-xs text-[#5A6882] uppercase tracking-wide">Type</span>
          </div>
          <Badge variant="outline" className={`text-xs capitalize ${TYPE_COLORS[group.type] ?? TYPE_COLORS.other}`}>
            {group.type}
          </Badge>
        </Card>

        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3.5 h-3.5 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5A6882]" />
            </span>
            <span className="text-xs text-[#5A6882] uppercase tracking-wide">Status</span>
          </div>
          <StatusBadge status={group.status} config={GROUP_STATUSES} />
        </Card>

        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-[#5A6882]" />
            <span className="text-xs text-[#5A6882] uppercase tracking-wide">Members</span>
          </div>
          <span className="text-lg font-bold text-[#ECF0F7]">{memberCount}</span>
        </Card>

        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#5A6882]" />
            <span className="text-xs text-[#5A6882] uppercase tracking-wide">Active Since</span>
          </div>
          <span className="text-sm text-[#ECF0F7]">
            {new Date(group.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </Card>
      </div>

      {/* Tags — placeholder for Phase 7 */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-5">
        <h3 className="text-xs font-semibold text-[#5A6882] uppercase tracking-wide mb-3">Tags</h3>
        <p className="text-xs text-[#5A6882] italic">No tags assigned. Tag management coming in a future update.</p>
      </Card>
    </div>
  );
}

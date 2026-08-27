"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, Briefcase, ListChecks, Users } from "lucide-react";
import TagChips from "@/components/crm/tag-chips";
import type { PositionDetail, TagItem } from "@/app/dashboard/management-types";

interface Props {
  position: PositionDetail;
  assignedCount: number;
  reqCount: number;
  tags: TagItem[];
}

export default function PositionOverviewTab({ position, assignedCount, reqCount, tags }: Props) {
  const warnings: string[] = [];
  if (reqCount === 0) warnings.push("No skill requirements defined");
  if (assignedCount === 0) warnings.push("No persons assigned to this position");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {warnings.length > 0 && (
        <Card className="bg-[#1B253B] border-[#EF4444]/20 p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-[#EF4444] flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Attention Needed
          </h3>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-sm text-[#F87171]">· {w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <h3 className="text-sm font-medium text-[#8B99B0] mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Position Details
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Department</dt>
            <dd className="text-[#ECF0F7]">{position.department || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Target Level</dt>
            <dd className="text-[#B48EFF]">{position.target_level || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Status</dt>
            <dd className="text-[#ECF0F7] capitalize">{position.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Created</dt>
            <dd className="text-[#ECF0F7]">{new Date(position.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        {position.description && (
          <p className="text-sm text-[#5A6882] mt-3 pt-3 border-t border-[#8B99B0]/10">{position.description}</p>
        )}
      </Card>

      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <h3 className="text-sm font-medium text-[#8B99B0] mb-3 flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Skill Requirements</dt>
            <dd className="text-[#ECF0F7]">{reqCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Assigned Persons</dt>
            <dd className="text-[#ECF0F7]">{assignedCount}</dd>
          </div>
        </dl>
        {tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#8B99B0]/10">
            <p className="text-xs text-[#5A6882] mb-2">Tags</p>
            <TagChips tags={tags} />
          </div>
        )}
      </Card>
    </div>
  );
}

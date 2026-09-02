"use client";

import { Card } from "@/components/ui/card";
import { Layers, Building2 } from "lucide-react";
import type { GroupMemberItem } from "@/app/dashboard/management-types";

interface Props {
  members: GroupMemberItem[];
}

export default function GroupSkillCoverageTab({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">Skill coverage analysis requires member position data.</p>
        <p className="text-xs text-[#5A6882] mt-1">Add members to this group to begin analysis.</p>
      </div>
    );
  }

  const uniqueDepts = [...new Set(members.map((m) => m.persons.department).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5A6882]">
        Full skill heatmap and gap analysis will be available once position data is linked in a future update.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <p className="text-xs text-[#5A6882] uppercase tracking-wide mb-1">Total Members</p>
          <p className="text-2xl font-bold text-[#ECF0F7]">{members.length}</p>
        </Card>
        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <p className="text-xs text-[#5A6882] uppercase tracking-wide mb-1">Departments Represented</p>
          <p className="text-2xl font-bold text-[#ECF0F7]">{uniqueDepts.length}</p>
        </Card>
      </div>

      {uniqueDepts.length > 0 && (
        <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
          <h3 className="text-xs font-semibold text-[#5A6882] uppercase tracking-wide mb-3">Departments</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueDepts.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#222C4A] text-xs text-[#8B99B0] border border-[#8B99B0]/10"
              >
                <Building2 className="w-3 h-3" />
                {dept}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

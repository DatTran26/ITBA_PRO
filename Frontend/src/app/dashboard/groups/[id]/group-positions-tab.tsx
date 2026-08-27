"use client";

import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { GroupMemberItem } from "@/app/dashboard/management-types";

interface Props {
  members: GroupMemberItem[];
}

export default function GroupPositionsTab({ members }: Props) {
  const membersWithDept = members.filter((m) => m.persons.department);
  const total = membersWithDept.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">No department data available for members.</p>
        <p className="text-xs text-[#5A6882] mt-1">Position assignment data will be available in a future update.</p>
      </div>
    );
  }

  /* Group members by department */
  const byDept = membersWithDept.reduce<Record<string, number>>((acc, m) => {
    const dept = m.persons.department!;
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(byDept).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#5A6882]">
        Departments derived from member profiles. Direct position assignment coming in a future update.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map(([dept, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <Card key={dept} className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#7C8FFF]" />
                  <span className="text-sm font-medium text-[#ECF0F7]">{dept}</span>
                </div>
                <span className="text-xs text-[#5A6882]">{count} member{count !== 1 ? "s" : ""}</span>
              </div>
              <div className="w-full h-1.5 bg-[#222C4A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7C8FFF] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-[#5A6882] mt-1">{pct}% of group members</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

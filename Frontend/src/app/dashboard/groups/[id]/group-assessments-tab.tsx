"use client";

import { ClipboardList } from "lucide-react";

interface Props {
  memberCount: number;
}

export default function GroupAssessmentsTab({ memberCount }: Props) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
        <ClipboardList className="w-6 h-6 text-[#5A6882]" />
      </div>
      <p className="text-sm text-[#5A6882]">Assessment results for group members will appear here.</p>
      {memberCount > 0 && (
        <p className="text-xs text-[#5A6882] mt-1">
          {memberCount} member{memberCount !== 1 ? "s" : ""} in this group.
        </p>
      )}
      <p className="text-xs text-[#5A6882] mt-3 max-w-xs">
        Assessment integration is planned for a future update.
      </p>
    </div>
  );
}

"use client";

import { ClipboardList } from "lucide-react";

interface Props {
  memberCount: number;
}

export default function GroupAssessmentsTab({ memberCount }: Props) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
        <ClipboardList className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Assessment results for group members will appear here.</p>
      {memberCount > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {memberCount} member{memberCount !== 1 ? "s" : ""} in this group.
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-3 max-w-xs">
        Assessment integration is planned for a future update.
      </p>
    </div>
  );
}

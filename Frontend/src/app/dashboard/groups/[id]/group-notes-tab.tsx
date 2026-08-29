"use client";

import NotesPanel from "@/components/crm/notes-panel";
import ActivityTimeline from "@/components/crm/activity-timeline";
import type { ActivityLogItem } from "@/app/dashboard/management-types";

interface Props {
  entityId: string;
  activityLogs: ActivityLogItem[];
}

export default function GroupNotesTab({ entityId, activityLogs }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs font-semibold text-[#5A6882] uppercase tracking-wide mb-3">Notes</h3>
        <NotesPanel entityType="group" entityId={entityId} />
      </div>
      <div>
        <h3 className="text-xs font-semibold text-[#5A6882] uppercase tracking-wide mb-3">Activity</h3>
        <ActivityTimeline items={activityLogs} />
      </div>
    </div>
  );
}

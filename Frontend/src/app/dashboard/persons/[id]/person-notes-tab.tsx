"use client";

import NotesPanel from "@/components/crm/notes-panel";
import ActivityTimeline from "@/components/crm/activity-timeline";
import type { ActivityLogItem } from "@/app/dashboard/management-types";

interface Props {
  personId: string;
  activityLogs: ActivityLogItem[];
}

export default function PersonNotesTab({ personId, activityLogs }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-medium text-[#ECF0F7] mb-3">Notes</h3>
        <NotesPanel entityType="person" entityId={personId} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-[#ECF0F7] mb-3">Activity</h3>
        <ActivityTimeline items={activityLogs} />
      </div>
    </div>
  );
}

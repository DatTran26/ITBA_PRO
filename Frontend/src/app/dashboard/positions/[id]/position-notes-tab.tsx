"use client";

import NotesPanel from "@/components/crm/notes-panel";
import ActivityTimeline from "@/components/crm/activity-timeline";
import type { ActivityLogItem } from "@/app/dashboard/management-types";

interface Props {
  entityId: string;
  activityLogs: ActivityLogItem[];
}

export default function PositionNotesTab({ entityId, activityLogs }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <NotesPanel entityType="position" entityId={entityId} />
      <ActivityTimeline items={activityLogs} />
    </div>
  );
}

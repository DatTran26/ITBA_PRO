import { createAdminClient } from "@/lib/supabase/admin";
import type { PipelineStatus } from "@/types/recruitment";

interface LogStatusChangeParams {
  jobApplicationId: string;
  fromStatus: PipelineStatus | null;
  toStatus: PipelineStatus;
  changedBy: string;
  note?: string;
}

export async function logStatusChange(params: LogStatusChangeParams): Promise<void> {
  const admin = createAdminClient();
  await admin.from("candidate_status_history").insert({
    job_application_id: params.jobApplicationId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    changed_by: params.changedBy,
    note: params.note ?? null,
  });
  await admin.from("activity_logs").insert({
    entity_type: "job_application",
    entity_id: params.jobApplicationId,
    action: `status_changed_to_${params.toStatus.toLowerCase()}`,
    details: { from: params.fromStatus, to: params.toStatus, note: params.note },
    actor_id: params.changedBy,
  });
}

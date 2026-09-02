import { SupabaseClient } from "@supabase/supabase-js";

export function logActivity(
  supabase: SupabaseClient,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  details?: Record<string, unknown>
) {
  // Fire-and-forget: don't await, just let it run
  supabase
    .from("activity_logs")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      details: details || null,
      actor_id: actorId,
    })
    .then(({ error }) => {
      if (error) console.error("Failed to log activity:", error.message);
    });
}

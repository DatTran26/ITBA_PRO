import { createAdminClient } from "@/lib/supabase/admin";

export interface InterviewerOption {
  id: string;
  name: string;
  email: string;
}

export async function listActiveInterviewers(): Promise<InterviewerOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, name, email")
    .in("role", ["interviewer", "hr", "admin", "super_admin"])
    .eq("is_active", true)
    .order("name");

  if (error || !data) return [];
  return data as InterviewerOption[];
}

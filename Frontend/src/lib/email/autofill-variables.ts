"use server";
import { createClient } from "@/lib/supabase/server";
import type { TemplateType } from "./template-variables";

interface AutofillContext {
    senderAuthId: string;
    relatedEntityType?: "job_application" | "interview_schedule" | "interview_session";
    relatedEntityId?: string;
    locale: "vi" | "en";
}

export async function autofillVariables(
    type: TemplateType,
    ctx: AutofillContext,
): Promise<Record<string, string>> {
    const supabase = await createClient();
    const result: Record<string, string> = {};

    // Sender info (users.name, users.email)
    const { data: sender } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("auth_id", ctx.senderAuthId)
        .single();
    if (sender) {
        result.hr_name = sender.name ?? "";
        result.hr_email = sender.email ?? "";
    }

    // Company name from system_settings
    const { data: companySetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "company_name")
        .single();
    result.company_name =
        typeof companySetting?.value === "string" ? companySetting.value : "ITBA";

    // Interview schedule autofill
    if (ctx.relatedEntityType === "interview_schedule" && ctx.relatedEntityId) {
        const { data: interview } = await supabase
            .from("interview_schedules")
            .select("scheduled_at, timezone, interviewer_id, job_application_id")
            .eq("id", ctx.relatedEntityId)
            .single();

        if (interview) {
            const tz = interview.timezone ?? "Asia/Ho_Chi_Minh";
            const dt = new Date(interview.scheduled_at);
            const lcl = ctx.locale === "vi" ? "vi-VN" : "en-US";
            result.interview_date = dt.toLocaleDateString(lcl, {
                timeZone: tz,
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            result.interview_time = dt.toLocaleTimeString(lcl, {
                timeZone: tz,
                hour: "2-digit",
                minute: "2-digit",
            });

            if (interview.interviewer_id) {
                const { data: interviewer } = await supabase
                    .from("users")
                    .select("name")
                    .eq("id", interview.interviewer_id)
                    .single();
                if (interviewer) {
                    result.interviewer_name = interviewer.name ?? "";
                    result.interviewer_names = interviewer.name ?? "";
                }
            }

            if (interview.job_application_id) {
                // job_applications joins persons and job_descriptions via FK
                const { data: app } = await supabase
                    .from("job_applications")
                    .select("id, cv_id, persons(full_name), job_descriptions(title)")
                    .eq("id", interview.job_application_id)
                    .single();

                if (app) {
                    const person = Array.isArray(app.persons)
                        ? app.persons[0]
                        : (app.persons as { full_name: string } | null);
                    const jd = Array.isArray(app.job_descriptions)
                        ? app.job_descriptions[0]
                        : (app.job_descriptions as { title: string } | null);

                    if (person) result.candidate_name = person.full_name ?? "";
                    if (jd) result.position_name = jd.title ?? "";

                    // CV signed URL via job_applications.cv_id
                    if (app.cv_id) {
                        const { data: cv } = await supabase
                            .from("candidate_cvs")
                            .select("storage_path")
                            .eq("id", app.cv_id)
                            .single();
                        if (cv?.storage_path) {
                            const { data: signed } = await supabase.storage
                                .from("candidate-cvs")
                                .createSignedUrl(cv.storage_path, 60 * 60 * 24 * 7);
                            if (signed?.signedUrl) {
                                result.candidate_cv_link = signed.signedUrl;
                            }
                        }
                    }
                }
            }
        }
    }

    // Job application autofill (for offer / onboard_confirm)
    if (ctx.relatedEntityType === "job_application" && ctx.relatedEntityId) {
        const { data: app } = await supabase
            .from("job_applications")
            .select("persons(full_name), job_descriptions(title)")
            .eq("id", ctx.relatedEntityId)
            .single();

        if (app) {
            const person = Array.isArray(app.persons)
                ? app.persons[0]
                : (app.persons as { full_name: string } | null);
            const jd = Array.isArray(app.job_descriptions)
                ? app.job_descriptions[0]
                : (app.job_descriptions as { title: string } | null);

            if (person) result.candidate_name = person.full_name ?? "";
            if (jd) result.position_name = jd.title ?? "";
        }
    }

    // Interview session autofill (schedule_interview / interview_reminder)
    if (ctx.relatedEntityType === "interview_session" && ctx.relatedEntityId) {
        const { data: session } = await supabase
            .from("interview_sessions")
            .select("scheduled_at, round, job_descriptions(title)")
            .eq("id", ctx.relatedEntityId)
            .single();

        if (session) {
            const tz = "Asia/Ho_Chi_Minh";
            const dt = new Date(session.scheduled_at);
            const lcl = ctx.locale === "vi" ? "vi-VN" : "en-US";
            result.interview_date = dt.toLocaleDateString(lcl, { timeZone: tz, year: "numeric", month: "long", day: "numeric" });
            result.interview_time = dt.toLocaleTimeString(lcl, { timeZone: tz, hour: "2-digit", minute: "2-digit" });
            result.interview_round = `Round ${session.round}`;

            const jd = Array.isArray(session.job_descriptions)
                ? (session.job_descriptions[0] as { title: string } | undefined)
                : (session.job_descriptions as { title: string } | null);
            if (jd) result.position_name = jd.title ?? "";

            // Get interviewer from first schedule in session
            const { data: schedule } = await supabase
                .from("interview_schedules")
                .select("interviewer_id")
                .eq("session_id", ctx.relatedEntityId)
                .not("interviewer_id", "is", null)
                .limit(1)
                .single();

            if (schedule?.interviewer_id) {
                const { data: interviewer } = await supabase
                    .from("users")
                    .select("name")
                    .eq("id", schedule.interviewer_id)
                    .single();
                if (interviewer) {
                    result.interviewer_name = interviewer.name ?? "";
                    result.interviewer_names = interviewer.name ?? "";
                }
            }
        }
    }

    return result;
}

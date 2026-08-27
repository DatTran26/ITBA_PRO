import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveProvider } from "./get-active-provider";
import { renderTemplate } from "./render-template";

export interface SendOneParams {
    supabase: SupabaseClient;
    provider: ActiveProvider;
    template: { id: string; subject: string; body_html: string; template_type: string; locale: string };
    recipient: { id: string; name: string; email: string };
    variables: Record<string, string>;
    sentBy: string;
    batchId?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
}

export type SendOneResult =
    | { ok: true; logId: string }
    | { ok: false; logId?: string; error: string };

export async function sendOne(params: SendOneParams): Promise<SendOneResult> {
    const {
        supabase,
        provider,
        template,
        recipient,
        variables,
        sentBy,
        batchId,
        relatedEntityType,
        relatedEntityId,
    } = params;

    const renderedSubject = renderTemplate(template.subject, variables);
    const renderedBody = renderTemplate(template.body_html, variables);

    // Insert email_log as pending
    const { data: logRow, error: logErr } = await supabase
        .from("email_logs")
        .insert({
            template_type: template.template_type,
            locale: template.locale,
            to_email: recipient.email,
            to_name: recipient.name ?? null,
            subject: renderedSubject,
            rendered_body: renderedBody,
            variables,
            related_entity_type: relatedEntityType ?? null,
            related_entity_id: relatedEntityId ?? null,
            sent_by: sentBy,
            sent_at: new Date().toISOString(),
            status: "pending",
            batch_id: batchId ?? null,
        })
        .select("id")
        .single();

    if (logErr || !logRow) {
        return { ok: false, error: "Failed to create email log" };
    }
    const logId = logRow.id as string;

    // Send via provider
    const result = await provider.provider.send({
        from: provider.sender,
        to: { email: recipient.email, name: recipient.name },
        subject: renderedSubject,
        html: renderedBody,
    });

    // Update log with final status
    await supabase
        .from("email_logs")
        .update({
            status: result.status,
            error_message: result.error ?? null,
        })
        .eq("id", logId);

    if (result.status === "failed") {
        return { ok: false, logId, error: result.error ?? "Send failed" };
    }

    return { ok: true, logId };
}

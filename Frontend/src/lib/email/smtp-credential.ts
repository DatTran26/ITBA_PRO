import { createClient } from "@/lib/supabase/server";

const ENV_KEY = "SMTP_PASSWORD_ENCRYPTION_KEY";

export function getMasterKey(): string {
    const key = process.env[ENV_KEY];
    if (!key || key.length < 32) {
        throw new Error(`${ENV_KEY} missing or too short (need ≥32 chars)`);
    }
    return key;
}

export interface SmtpConfigPublic {
    enabled: boolean;
    provider_type: "gmail_smtp" | "resend";
    sender_email: string;
    sender_name: string;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_username: string | null;
    has_password: boolean;
    min_interval_seconds: number;
    updated_at: string | null;
}

export async function readSmtpConfigPublic(): Promise<SmtpConfigPublic> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("email_provider_config")
        .select(
            "enabled, provider_type, sender_email, sender_name, smtp_host, smtp_port, smtp_username, smtp_password_encrypted, min_interval_seconds, updated_at"
        )
        .maybeSingle();

    if (error || !data) {
        return {
            enabled: false,
            provider_type: "gmail_smtp",
            sender_email: "",
            sender_name: "",
            smtp_host: null,
            smtp_port: 465,
            smtp_username: null,
            has_password: false,
            min_interval_seconds: 60,
            updated_at: null,
        };
    }

    return {
        enabled: Boolean(data.enabled),
        provider_type: (data.provider_type as "gmail_smtp" | "resend") || "gmail_smtp",
        sender_email: data.sender_email || "",
        sender_name: data.sender_name || "",
        smtp_host: data.smtp_host || null,
        smtp_port: data.smtp_port || null,
        smtp_username: data.smtp_username || null,
        has_password: data.smtp_password_encrypted != null,
        min_interval_seconds: data.min_interval_seconds ?? 60,
        updated_at: data.updated_at || null,
    };
}

export async function readSmtpConfigForSending(): Promise<SmtpConfigPublic & { decrypted_password: string | null }> {
    const supabase = await createClient();
    const masterKey = getMasterKey();
    const config = await readSmtpConfigPublic();
    const { data: pw } = await supabase.rpc("decrypt_smtp_password", { master_key: masterKey });
    return { ...config, decrypted_password: pw ?? null };
}

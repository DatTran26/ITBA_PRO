import { createClient } from "@/lib/supabase/server";
import { getMasterKey } from "./smtp-credential";
import { createGmailSmtpProvider } from "./providers/gmail-smtp-provider";
import type { EmailProvider } from "./provider";

export interface ActiveProvider {
    provider: EmailProvider;
    sender: { email: string; name: string };
    minIntervalSeconds: number;
}

/**
 * Server-only: load active provider config + decrypted password,
 * return provider instance. Throws if not enabled or misconfigured.
 */
export async function getActiveEmailProvider(): Promise<ActiveProvider> {
    const supabase = await createClient();

    const { data: cfg, error } = await supabase
        .from("email_provider_config")
        .select("enabled, provider_type, sender_email, sender_name, smtp_host, smtp_port, smtp_username, min_interval_seconds")
        .single();

    if (error) throw new Error(`Failed to load email config: ${error.message}`);
    if (!cfg?.enabled) throw new Error("Email sending is disabled");
    if (cfg.provider_type !== "gmail_smtp") {
        throw new Error(`Unsupported provider: ${cfg.provider_type}`);
    }

    const { data: pw } = await supabase.rpc("decrypt_smtp_password", {
        master_key: getMasterKey(),
    });
    if (!pw) throw new Error("SMTP password not configured");

    return {
        provider: createGmailSmtpProvider({
            host: cfg.smtp_host ?? "smtp.gmail.com",
            port: cfg.smtp_port ?? 465,
            username: cfg.smtp_username ?? cfg.sender_email,
            password: pw as string,
        }),
        sender: { email: cfg.sender_email, name: cfg.sender_name },
        minIntervalSeconds: cfg.min_interval_seconds ?? 60,
    };
}

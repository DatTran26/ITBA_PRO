import nodemailer from "nodemailer";
import type { EmailProvider, SendInput, SendResult } from "../provider";

export interface GmailSmtpConfig {
    host: string;
    port: number;
    username: string;
    password: string; // decrypted; caller's responsibility
}

export function createGmailSmtpProvider(config: GmailSmtpConfig): EmailProvider {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: { user: config.username, pass: config.password },
    });

    return {
        async send(input: SendInput): Promise<SendResult> {
            try {
                const info = await transporter.sendMail({
                    from: `"${input.from.name}" <${input.from.email}>`,
                    to: input.to.name
                        ? `"${input.to.name}" <${input.to.email}>`
                        : input.to.email,
                    subject: input.subject,
                    html: input.html,
                });
                return { messageId: info.messageId, status: "sent" };
            } catch (err) {
                return {
                    status: "failed",
                    error: err instanceof Error ? err.message : "Unknown error",
                };
            }
        },
    };
}

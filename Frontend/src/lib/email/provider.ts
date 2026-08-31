export interface SendInput {
    from: { email: string; name: string };
    to: { email: string; name?: string };
    subject: string;
    html: string;
}

export interface SendResult {
    messageId?: string;
    status: "sent" | "failed";
    error?: string;
}

export interface EmailProvider {
    send(input: SendInput): Promise<SendResult>;
}

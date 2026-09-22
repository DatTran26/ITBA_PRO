"use client";

interface Props {
    subject: string;
    body: string;
}

export default function TemplatePreview({ subject, body }: Props) {
    return (
        <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <span className="text-xs text-slate-500">Subject</span>
                <p className="mt-1 text-sm text-primary">{subject || "Subject empty"}</p>
            </div>
            <iframe
                srcDoc={body}
                sandbox="allow-same-origin"
                className="h-[32rem] w-full rounded-2xl border border-border bg-white"
                title="Email preview"
            />
        </div>
    );
}

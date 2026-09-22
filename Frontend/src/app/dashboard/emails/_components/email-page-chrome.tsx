import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

interface EmailBreadcrumbProps {
    current: string;
    backHref?: string;
}

export default function EmailBreadcrumb({ current, backHref }: EmailBreadcrumbProps) {
    return (
        <div className="mb-8 flex items-center gap-3">
            {backHref && (
                <Link
                    href={backHref}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            )}
            <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground/70">Emails</span>
                <span className="text-muted-foreground/70">/</span>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{current}</span>
            </div>
        </div>
    );
}

export const emailInputClass =
    "w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";

export const emailSelectClass = `${emailInputClass} cursor-pointer`;

export const emailPanelClass =
    "rounded-[1.5rem] border border-border bg-card p-5 shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] backdrop-blur";

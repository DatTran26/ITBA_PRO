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
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            )}
            <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-300/60" />
                <span className="text-xs uppercase tracking-[0.22em] text-slate-600">Emails</span>
                <span className="text-slate-700">/</span>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">{current}</span>
            </div>
        </div>
    );
}

export const emailInputClass =
    "w-full rounded-2xl border border-white/10 bg-background px-4 py-3 text-base text-primary outline-none transition placeholder:text-slate-600 focus:border-cyan-200/50 focus:ring-4 focus:ring-cyan-200/10 disabled:cursor-not-allowed disabled:opacity-50";

export const emailSelectClass = `${emailInputClass} cursor-pointer`;

export const emailPanelClass =
    "rounded-[1.5rem] border border-white/10 bg-background/78 p-5 shadow-xl shadow-black/20 backdrop-blur";

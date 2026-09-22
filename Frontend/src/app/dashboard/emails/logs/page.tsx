import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import LogsClient from "./logs-client";
import EmailBreadcrumb from "../_components/email-page-chrome";
import { Activity, ScrollText } from "lucide-react";

const ALLOWED_ROLES = ["admin", "super_admin", "hr", "interviewer", "recruiter"];

export default async function EmailLogsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .single();

    if (!userData || !ALLOWED_ROLES.includes(userData.role)) {
        redirect("/dashboard");
    }

    const { data: logs, count } = await supabase
        .from("email_logs")
        .select(
            "id, template_type, locale, to_email, to_name, subject, status, sent_at, error_message, sent_by, variables",
            { count: "exact" },
        )
        .order("sent_at", { ascending: false })
        .range(0, 19);

    return (
        <PageContainer>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background p-4 shadow-2xl shadow-black/30 sm:p-8">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-cyan-300/[0.06] blur-[90px]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-80 bg-amber-300/[0.05] blur-[90px]" />
                <div className="relative">
                    <EmailBreadcrumb current="Logs" backHref="/dashboard/emails" />
                    <header className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3 py-1.5">
                                <Activity className="h-3.5 w-3.5 text-cyan-300" />
                                <span className="text-xs font-semibold text-cyan-200/80">Delivery telemetry</span>
                            </div>
                            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">
                                Email logs
                            </h1>
                            <p className="mt-3 max-w-xl text-base leading-7 text-slate-400">
                                Review delivery events, filter recipient traffic, and inspect payload details when a message needs attention.
                            </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-cyan-200/15 bg-cyan-300/[0.06] p-5">
                            <ScrollText className="mb-4 h-6 w-6 text-cyan-200" />
                            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/60">Total events</p>
                            <p className="font-display text-3xl text-foreground">{count ?? 0}</p>
                        </div>
                    </header>
                    <LogsClient initialLogs={logs ?? []} initialTotal={count ?? 0} />
                </div>
            </div>
        </PageContainer>
    );
}

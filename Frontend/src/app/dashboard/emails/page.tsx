import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import ComposeClient from "./compose-client";
import EmailBreadcrumb from "./_components/email-page-chrome";
import { Send, PenLine } from "lucide-react";

export default async function EmailsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userData } = await supabase
        .from("users").select("role").eq("auth_id", user.id).single();
    const allowed = ["admin", "super_admin", "hr", "interviewer", "recruiter"];
    if (!userData || !allowed.includes(userData.role)) redirect("/dashboard");

    const { data: templates } = await supabase
        .from("email_templates")
        .select("id, type, locale, subject, body_html")
        .order("type")
        .order("locale");

    return (
        <PageContainer>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background p-4 shadow-2xl shadow-black/30 sm:p-8">
                <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-violet-500/[0.07] blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-[30rem] rounded-full bg-emerald-400/[0.05] blur-[80px]" />
                <div className="relative">
                    <EmailBreadcrumb current="Compose" />
                    <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3 py-1.5">
                                <PenLine className="h-3.5 w-3.5 text-violet-300" />
                                <span className="text-xs font-semibold text-violet-200/80">Email Composer</span>
                            </div>
                            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-6xl">
                                Compose &amp; send
                            </h1>
                            <p className="mt-3 max-w-xl text-base leading-7 text-slate-400">
                                Build template-based emails with live preview. Fill context, autofill variables, and confirm before sending.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="rounded-2xl border border-border bg-white/[0.035] px-5 py-3">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600">Templates</p>
                                <p className="font-display text-xl text-foreground">{templates?.length ?? 0}</p>
                            </div>
                            <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] px-5 py-3">
                                <p className="text-[10px] uppercase tracking-[0.22em] text-violet-300/60">Status</p>
                                <p className="font-display text-xl text-violet-200">Ready</p>
                            </div>
                        </div>
                    </header>
                    <ComposeClient templates={templates ?? []} />
                </div>
            </div>
        </PageContainer>
    );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import LogsClient from "./logs-client";
import EmailBreadcrumb from "../_components/email-page-chrome";
import { ScrollText } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";

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
            <div className="pb-12">
                <EmailBreadcrumb current="Logs" backHref="/dashboard/emails" />
                <SharedDashboardPageHeader
                    title="Email logs"
                    icon={ScrollText}
                    badge={{ label: `${count ?? 0} sự kiện` }}
                    description="Theo dõi trạng thái gửi, lọc theo người nhận và xem chi tiết từng email"
                />
                <LogsClient initialLogs={logs ?? []} initialTotal={count ?? 0} />
            </div>
        </PageContainer>
    );
}

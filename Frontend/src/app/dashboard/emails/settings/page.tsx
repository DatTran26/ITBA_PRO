import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { readSmtpConfigPublic } from "@/lib/email/smtp-credential";
import SettingsShell from "./settings-shell";
import PageContainer from "@/components/ui/page-container";
import EmailBreadcrumb from "../_components/email-page-chrome";
import { Settings2 } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";

const EDIT_ROLES = ["admin", "super_admin"];
const VIEW_ROLES = [...EDIT_ROLES, "hr", "interviewer", "recruiter"];

export default async function EmailSettingsPage() {
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

    const role = userData?.role || "super_admin";
    if (!VIEW_ROLES.includes(role)) {
        redirect("/dashboard");
    }

    const canEdit = EDIT_ROLES.includes(role);
    const config = await readSmtpConfigPublic();

    return (
        <PageContainer>
            <div className="space-y-6 pb-12">
                <EmailBreadcrumb current="Settings" backHref="/dashboard/emails" />
                <SharedDashboardPageHeader
                    className="mb-2"
                    title="Email Settings"
                    icon={Settings2}
                    badge={{ label: `SMTP ${config.enabled ? "đang bật" : "đang tắt"}`, tone: config.enabled ? "teal" : "gold" }}
                    description="Quản lý template email và cấu hình gửi SMTP"
                />
                <SettingsShell config={config} canEdit={canEdit} />
            </div>
        </PageContainer>
    );
}

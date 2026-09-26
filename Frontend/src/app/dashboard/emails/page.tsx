import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import ComposeClient from "./compose-client";
import EmailBreadcrumb from "./_components/email-page-chrome";
import { Send } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";

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
            <div className="space-y-6 pb-12">
                <EmailBreadcrumb current="Soạn thư" />
                <SharedDashboardPageHeader
                    className="mb-2"
                    title="Soạn email"
                    icon={Send}
                    badge={{ label: `${templates?.length ?? 0} mẫu`, tone: "violet" }}
                    description="Chọn mẫu, người nhận và ngữ cảnh — xem trước đúng như ứng viên nhận được rồi mới gửi"
                />
                <ComposeClient templates={templates ?? []} />
            </div>
        </PageContainer>
    );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { User, Mail, Shield, Calendar, Info } from "lucide-react";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { SharedDashboardPageHeader } from "@/components/shares";
import FormSection from "@/components/shares/form-section";
import { ROLE_LABEL, roleTone } from "@/lib/ui/roles";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

    if (!userRecord) {
        userRecord = {
            id: user.id,
            auth_id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
            email: user.email || "",
            role: "super_admin",
            created_at: new Date().toISOString(),
        };
    }

    const createdAt = userRecord.created_at ? new Date(userRecord.created_at).toLocaleDateString("vi-VN", {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : "N/A";

    const role = userRecord.role || "recruiter";
    const tone = roleTone(role);
    const fields = [
        { icon: User, label: "Họ tên", value: userRecord.name },
        { icon: Mail, label: "Email", value: userRecord.email },
        { icon: Calendar, label: "Thành viên từ", value: createdAt },
    ];

    return (
        <PageTransition className="min-h-screen bg-transparent text-foreground pb-12">
            <AppNavbar />

            <PageContainer>
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
                <SharedDashboardPageHeader
                    title="Profile"
                    icon={User}
                    badge={{ label: ROLE_LABEL[role] ?? role, tone: tone.name }}
                    description="Thông tin tài khoản và quyền truy cập của bạn"
                />

                <div className="flex flex-col gap-5 max-w-3xl">
                    <FormSection icon={Shield} tone="blue" title="Thông tin tài khoản" subtitle="Hồ sơ đăng nhập hệ thống">
                        <dl className="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2">
                            {fields.map(({ icon: Icon, label, value }) => (
                                <div key={label} className="min-w-0 space-y-1.5">
                                    <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
                                    <dd className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                                        <Icon className="w-4 h-4 shrink-0 text-primary/70" />
                                        <span className="truncate">{value}</span>
                                    </dd>
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <dt className="text-xs font-bold text-muted-foreground">Vai trò</dt>
                                <dd>
                                    <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ color: tone.ink, backgroundColor: tone.bg }}>
                                        {ROLE_LABEL[role] ?? role}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </FormSection>

                    <FormSection icon={Info} tone="orange" title="Quyền truy cập" subtitle="Ai có thể thay đổi vai trò">
                        <p className="p-5 text-sm text-muted-foreground leading-relaxed">
                            Vai trò và quyền truy cập do Super Admin quản lý. Liên hệ Super Admin nếu bạn cần đổi vai trò.
                        </p>
                    </FormSection>
                </div>
            </PageContainer>
        </PageTransition>
    );
}

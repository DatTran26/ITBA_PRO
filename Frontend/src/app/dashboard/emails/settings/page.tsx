import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { readSmtpConfigPublic } from "@/lib/email/smtp-credential";
import SettingsShell from "./settings-shell";
import PageContainer from "@/components/ui/page-container";
import EmailBreadcrumb from "../_components/email-page-chrome";
import { Wifi, WifiOff } from "lucide-react";

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
            <div className="space-y-6">
                <EmailBreadcrumb current="Settings" backHref="/dashboard/emails" />
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-[#ECF0F7]">Email Settings</h1>
                        <p className="mt-1 text-sm text-[#5A6882]">
                            Manage email templates and SMTP delivery configuration.
                        </p>
                    </div>
                    <div className={`self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                        config.enabled
                            ? "bg-[#36DDAB]/10 border-[#36DDAB]/20 text-[#36DDAB]"
                            : "bg-[#8B99B0]/8 border-[#8B99B0]/15 text-[#5A6882]"
                    }`}>
                        {config.enabled
                            ? <Wifi className="w-3.5 h-3.5" />
                            : <WifiOff className="w-3.5 h-3.5" />
                        }
                        SMTP {config.enabled ? "Active" : "Disabled"}
                    </div>
                </header>
                <SettingsShell config={config} canEdit={canEdit} />
            </div>
        </PageContainer>
    );
}

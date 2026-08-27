import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageContainer from "@/components/ui/page-container";
import TemplatesClient from "./templates-client";

export default async function TemplatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userData } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("auth_id", user.id)
        .single();

    if (!userData) redirect("/login");

    const { data: templates } = await supabase
        .from("assessment_templates")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <>
            <AppNavbar user={userData} />
            <PageContainer>
                <TemplatesClient
                    templates={templates || []}
                    isAdmin={userData.role === "admin" || userData.role === "super_admin"}
                    userId={userData.id}
                />
            </PageContainer>
        </>
    );
}

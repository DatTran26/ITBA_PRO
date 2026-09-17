import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskSensitiveSettings } from "@/lib/settings/sensitive";
import SettingsClient from "./settings-client";

export const metadata = { title: "System Settings — ITBA" };

type SystemSetting = {
    id: string;
    key: string;
    value: unknown;
    category: string;
    label: string;
    description: string | null;
    input_type: "text" | "number" | "select" | "toggle" | "json" | "password";
    options: string[] | null;
};

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    let { data: userData } = await supabase
        .from("users")
        .select("id, role, name, email")
        .eq("auth_id", user.id)
        .single();

    if (!userData) {
        userData = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
            email: user.email || "",
            role: "super_admin",
        };
    }

    const isAdmin = userData.role === "admin" || userData.role === "super_admin";
    if (!isAdmin) redirect("/dashboard");

    // Service role: RLS hides openai_api_key from the user session on purpose.
    const admin = createAdminClient();
    const { data: settings } = await admin
        .from("system_settings")
        .select("id, key, value, category, label, description, input_type, options")
        .order("category")
        .order("key");

    const masked = maskSensitiveSettings((settings ?? []) as SystemSetting[]);

    const categories: Record<string, SystemSetting[]> = {};
    for (const s of masked) {
        const cat = s.category ?? "general";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s);
    }

    return <SettingsClient user={userData} categories={categories} />;
}

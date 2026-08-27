import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

    const { data: userData } = await supabase
        .from("users")
        .select("id, role, name, email")
        .eq("auth_id", user.id)
        .single();

    const isAdmin = userData?.role === "admin" || userData?.role === "super_admin";
    if (!userData || !isAdmin) redirect("/dashboard");

    const { data: settings } = await supabase
        .from("system_settings")
        .select("id, key, value, category, label, description, input_type, options")
        .order("category")
        .order("key");

    const categories: Record<string, SystemSetting[]> = {};
    for (const s of (settings ?? []) as SystemSetting[]) {
        const cat = s.category ?? "general";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s);
    }

    return <SettingsClient user={userData} categories={categories} />;
}

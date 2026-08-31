import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VersionsClient from "./versions-client";

export const metadata = {
    title: "Version History – ITBA AI",
    description: "Review and approve new feature releases",
};

export default async function VersionsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", user.id)
        .single();

    const role = userData?.role;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" || isSuperAdmin;

    let query = supabase
        .from("versions")
        .select("*")
        .order("version_number", { ascending: false });

    // Admin and Super Admin see the same version list; only Super Admin can edit.
    if (!isAdmin) {
        query = query.eq("status", "approved");
    }

    const { data: versions } = await query;

    return <VersionsClient versions={versions ?? []} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />;
}

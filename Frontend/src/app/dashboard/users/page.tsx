import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import UsersClient from "./users-client";

export default async function UsersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

    const role = userRecord?.role;
    const isSuperAdmin = role === "super_admin";
    const isAdmin = role === "admin" || isSuperAdmin;

    if (!userRecord || !isAdmin) {
        // Only admins and super admins can manage users
        redirect("/dashboard");
    }

    // Grab all users for management using admin client to bypass RLS
    let usersList: any[] = [];
    try {
        const adminSupabase = createAdminClient();
        let query = adminSupabase.from("users").select("*");

        if (role !== "super_admin") {
            query = query.neq("role", "super_admin");
        }

        const { data: usersData } = await query.order("created_at", { ascending: false });
        usersList = usersData || [];
    } catch (e) {
        console.error("[Users Page] Retrieval protocol failed:", e);
    }

    return (
        <UsersClient
            initialUsers={usersList}
            currentUser={userRecord}
        />
    );
}

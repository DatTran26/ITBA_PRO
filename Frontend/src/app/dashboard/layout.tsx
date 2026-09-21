import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavShell from "@/components/ui/nav-shell";
import { readUiLayout } from "@/lib/settings/ui-layout";
import { readSidebarCollapsed } from "@/components/ui/sidebar-collapse-cookie";
import type { UserRole } from "@/components/ui/nav-config";
import { cookies } from "next/headers";
import { DEV_AUTH_COOKIE, parseDevAuthCookie } from "@/lib/dev-auth";

/* Force dynamic so router.refresh() re-reads ui_layout from DB instead of
 * serving a static-cached layout. Without this, Next 16 may serve stale
 * cached server output even after realtime broadcasts a layout change. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const devUser = parseDevAuthCookie(cookieStore.get(DEV_AUTH_COOKIE)?.value);

    let user: { id: string; email?: string; user_metadata?: { name?: string } } | null = null;
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
    if (!devUser) {
        supabase = await createClient();
        const auth = await supabase.auth.getUser();
        user = auth.data.user;
    }
    if (!user && !devUser) redirect("/login");

    /* Fetch user data + layout setting + collapse cookie in parallel.
     * NavShell decides chrome based on layout; pages keep their existing
     * AppNavbar calls (self-suppressed in sidebar mode via context). */
    const [userResult, layout, sidebarCollapsed] = await Promise.all([
        user && supabase
            ? supabase.from("users").select("name, email, role").eq("auth_id", user.id).single()
            : Promise.resolve({ data: devUser }),
        readUiLayout(),
        readSidebarCollapsed(),
    ]);

    const userData = userResult.data
        ? {
              name: (userResult.data.name as string) || user?.email?.split("@")[0] || "User",
              email: (userResult.data.email as string) || user?.email || "",
              role: (userResult.data.role as UserRole) || "super_admin",
          }
        : {
              name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin",
              email: user?.email || "",
              role: "super_admin" as UserRole,
          };

    return (
        <div
            data-ui-layout={layout}
            className="min-h-screen bg-[#121A2E] text-[#ECF0F7] font-body selection:bg-[#5B6CF0]/30 relative"
            suppressHydrationWarning
        >
            {/* Global Mesh Gradient Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60" suppressHydrationWarning>
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#5B6CF0]/[0.08] blur-[120px] rounded-full" suppressHydrationWarning />
                <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-[#7C8FFF]/[0.05] blur-[100px] rounded-full" suppressHydrationWarning />
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-[#36DDAB]/[0.03] blur-[80px] rounded-full" suppressHydrationWarning />
            </div>

            <div className="relative z-10" suppressHydrationWarning>
                <NavShell user={userData} layout={layout} sidebarCollapsed={sidebarCollapsed}>
                    {children}
                </NavShell>
            </div>
        </div>
    );
}

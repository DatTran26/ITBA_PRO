"use client";

import { useState, useCallback, useEffect } from "react";
import AppSidebar from "@/components/ui/app-sidebar";
import AppContentHeader from "@/components/ui/app-content-header";
import UiLayoutRealtimeListener from "@/components/ui/ui-layout-realtime-listener";
import { UiLayoutProvider } from "@/components/ui/ui-layout-context";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SIDEBAR_COLLAPSED_COOKIE } from "@/components/ui/sidebar-collapse-cookie-name";
import type { UiLayout } from "@/lib/settings/ui-layout";
import type { UserRole } from "@/components/ui/nav-config";

interface NavShellProps {
    user: { name: string; email: string; role: UserRole } | null;
    layout: UiLayout;
    sidebarCollapsed: boolean;
    children: React.ReactNode;
}

/**
 * Layout shell. Decides whether to render sidebar chrome based on the
 * server-fetched ui_layout setting. Always mounts the realtime listener
 * so layout changes propagate live.
 *
 * Topnav mode: renders only the context provider + listener. Pages keep
 * their existing inline <AppNavbar /> calls.
 *
 * Sidebar mode: renders sidebar (desktop fixed, mobile Sheet) and a
 * content-area header above the page content. AppNavbar self-suppresses
 * via context to avoid duplicate chrome.
 */
export default function NavShell({ user, layout, sidebarCollapsed, children }: NavShellProps) {
    const [activeLayout, setActiveLayout] = useState<typeof layout>(layout);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(sidebarCollapsed);

    /* Persist layout to cookie so server reads stay correct on remount/refresh,
     * even if the DB read in readUiLayout() fails transiently. */
    useEffect(() => {
        document.cookie = `ui_layout=${activeLayout}; path=/; max-age=31536000; SameSite=Lax`;
    }, [activeLayout]);

    const handleSetLayout = useCallback((next: typeof layout) => {
        setActiveLayout(next);
    }, []);

    function handleCollapseChange(next: boolean) {
        setCollapsed(next);
        document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
    }

    if (activeLayout === "topnav") {
        return (
            <UiLayoutProvider value={{ layout: activeLayout, setLayout: handleSetLayout, mobileMenuOpen, setMobileMenuOpen }}>
                <UiLayoutRealtimeListener currentLayout={activeLayout} />
                {children}
            </UiLayoutProvider>
        );
    }

    /* Sidebar mode */
    const contentMargin = collapsed ? "md:ml-16" : "md:ml-[260px]";

    return (
        <UiLayoutProvider value={{ layout: activeLayout, setLayout: handleSetLayout, mobileMenuOpen, setMobileMenuOpen }}>
            <UiLayoutRealtimeListener currentLayout={activeLayout} />

            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <AppSidebar
                    user={user}
                    collapsed={collapsed}
                    onCollapseChange={handleCollapseChange}
                />
            </div>

            {/* Mobile drawer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-[280px] bg-[#101828] border-[#8B99B0]/10">
                    <AppSidebar
                        user={user}
                        collapsed={false}
                        onCollapseChange={() => {}}
                        isMobile
                        onMobileClose={() => setMobileMenuOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            {/* Content area: shifts right of sidebar on desktop */}
            <div className={`${contentMargin} transition-[margin] duration-200`}>
                <AppContentHeader
                    user={user}
                    userRole={user?.role}
                    onMobileMenuClick={() => setMobileMenuOpen(true)}
                />
                {children}
            </div>
        </UiLayoutProvider>
    );
}

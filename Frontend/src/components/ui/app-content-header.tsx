"use client";

import { Menu, HelpCircle } from "lucide-react";
import NotificationBell from "@/components/ui/notification-bell";
import NavbarUserDropdown from "@/components/ui/navbar-user-dropdown";
import type { UserRole } from "@/components/ui/nav-config";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface AppContentHeaderProps {
    /** Full user object for the avatar dropdown. */
    user?: { name: string; email: string; role: UserRole } | null;
    /** Used by NotificationBell to filter notifications by role. */
    userRole?: string | null;
    /** Wired by NavShell to open mobile drawer. */
    onMobileMenuClick: () => void;
    /** Page title shown when no breadcrumbs provided. */
    pageTitle?: string;
    /** Breadcrumb trail (last item = current page, no link). */
    breadcrumbs?: BreadcrumbItem[];
    /** Show notification bell (default: true). */
    showNotifications?: boolean;
}

/**
 * Thin utility strip rendered above main content in sidebar layout.
 * Sidebar handles navigation; this strip handles breadcrumbs + bell + help.
 * Renders ONLY when ui_layout === 'sidebar' (NavShell decides).
 */
export default function AppContentHeader({
    user,
    userRole,
    onMobileMenuClick,
    pageTitle,
    breadcrumbs,
    showNotifications = true,
}: AppContentHeaderProps) {
    return (
        <header className="h-12 border-b border-muted-foreground/10 px-4 flex items-center gap-3 bg-card/40 backdrop-blur-md sticky top-0 z-30">
            {/* Mobile hamburger */}
            <button
                onClick={onMobileMenuClick}
                className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs / page title */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-shrink">
                {breadcrumbs && breadcrumbs.length > 0
                    ? breadcrumbs.map((b, i) => (
                          <span key={`${b.label}-${i}`} className="flex items-center gap-2">
                              {i > 0 && <span className="text-muted-foreground">/</span>}
                              {b.href ? (
                                  <a href={b.href} className="hover:text-foreground transition-colors">
                                      {b.label}
                                  </a>
                              ) : (
                                  <span className="text-foreground">{b.label}</span>
                              )}
                          </span>
                      ))
                    : pageTitle && <span className="text-foreground truncate">{pageTitle}</span>}
            </div>

            <div className="flex-1" />

            {/* Right: Help + Bell + User */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:flex items-center justify-center"
                    aria-label="Help & Support"
                    title="Help & Support"
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
                {showNotifications && <NotificationBell userRole={userRole ?? undefined} />}
                <NavbarUserDropdown user={user ?? null} variant="topnav" />
            </div>
        </header>
    );
}

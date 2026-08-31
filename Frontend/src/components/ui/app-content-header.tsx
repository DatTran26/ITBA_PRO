"use client";

import { Menu, Search, HelpCircle } from "lucide-react";
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
    /** Show search bar (default: true). */
    showSearch?: boolean;
    /** Show notification bell (default: true). */
    showNotifications?: boolean;
}

/**
 * Thin utility strip rendered above main content in sidebar layout.
 * Sidebar handles navigation; this strip handles search + bell + help.
 * Renders ONLY when ui_layout === 'sidebar' (NavShell decides).
 */
export default function AppContentHeader({
    user,
    userRole,
    onMobileMenuClick,
    pageTitle,
    breadcrumbs,
    showSearch = true,
    showNotifications = true,
}: AppContentHeaderProps) {
    return (
        <header className="h-12 border-b border-[#8B99B0]/10 px-4 flex items-center gap-3 bg-[#0C1220]/40 backdrop-blur-md sticky top-0 z-30">
            {/* Mobile hamburger */}
            <button
                onClick={onMobileMenuClick}
                className="md:hidden p-2 -ml-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840] transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs / page title */}
            <div className="flex items-center gap-2 text-sm text-[#8B99B0] min-w-0 flex-shrink">
                {breadcrumbs && breadcrumbs.length > 0
                    ? breadcrumbs.map((b, i) => (
                          <span key={`${b.label}-${i}`} className="flex items-center gap-2">
                              {i > 0 && <span className="text-[#5A6882]">/</span>}
                              {b.href ? (
                                  <a href={b.href} className="hover:text-[#ECF0F7] transition-colors">
                                      {b.label}
                                  </a>
                              ) : (
                                  <span className="text-[#ECF0F7]">{b.label}</span>
                              )}
                          </span>
                      ))
                    : pageTitle && <span className="text-[#ECF0F7] truncate">{pageTitle}</span>}
            </div>

            {/* Search center (desktop only) */}
            {showSearch ? (
                <div className="flex-1 hidden md:flex justify-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6882]" />
                        <input
                            type="text"
                            placeholder="Search candidates, assessments, or insights..."
                            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#0C1220]/60 border border-[#8B99B0]/10 text-sm text-[#ECF0F7] placeholder:text-[#5A6882]/70 focus:outline-none focus:border-[#7C8FFF]/40 focus:ring-1 focus:ring-[#7C8FFF]/20 transition-all"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1" />
            )}

            {/* Mobile spacer when search is hidden */}
            <div className={showSearch ? "flex-1 md:hidden" : ""} />

            {/* Right: Help + Bell + User */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    className="p-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840] transition-colors hidden sm:flex items-center justify-center"
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

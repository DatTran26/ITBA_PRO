"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, GitBranch, LayoutDashboard, Search } from "lucide-react";
import { AppLogo } from "@/components/ui/app-navbar";
import {
    visibleGroupsFor,
    visibleLinksFor,
    shouldShowVersionsStandalone,
    type NavGroup,
    type UserRole,
} from "@/components/ui/nav-config";
import SidebarRecentNav from "@/components/ui/sidebar-recent-nav";

interface AppSidebarProps {
    user: { name: string; email: string; role: UserRole } | null;
    collapsed: boolean;
    onCollapseChange: (next: boolean) => void;
    isMobile?: boolean;
    onMobileClose?: () => void;
}

export default function AppSidebar({
    user,
    collapsed,
    onCollapseChange,
    isMobile = false,
    onMobileClose,
}: AppSidebarProps) {
    const [isHovering, setIsHovering] = useState(false);
    const pathname = usePathname();
    const groups = visibleGroupsFor(user?.role);
    const showVersionsStandalone = shouldShowVersionsStandalone(user?.role);
    const effectiveCollapsed = collapsed && !isMobile && !isHovering;

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        groups.forEach((g) => {
            if (g.links.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"))) initial.add(g.id);
        });
        return initial;
    });

    function toggle(id: string) {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    const isOverlay = collapsed && !isMobile && isHovering;
    const containerClass = isMobile
        ? "h-full w-full flex flex-col glass-card-sidebar rounded-none"
        : `fixed left-0 top-0 h-screen z-40 glass-card-sidebar rounded-none flex flex-col overflow-hidden transition-[width] duration-200 ease-out ${
              effectiveCollapsed ? "w-16" : "w-[260px]"
          }${isOverlay ? " shadow-[4px_0_24px_rgba(0,0,0,0.4)]" : ""}`;

    return (
        <aside
            className={containerClass}
            style={{ willChange: "width" }}
            suppressHydrationWarning
            onMouseEnter={() => { if (collapsed && !isMobile) setIsHovering(true); }}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className={`h-12 flex items-center shrink-0 border-b border-muted-foreground/10 ${effectiveCollapsed ? "justify-center" : "px-3"}`}>
                <AppLogo showText={!effectiveCollapsed} />
            </div>

            <div className="px-2 pt-3 pb-1 shrink-0">
                <div className={`flex items-center rounded-lg text-muted-foreground hover:text-muted-foreground transition-all duration-200 cursor-pointer select-none
                    ${effectiveCollapsed
                        ? "justify-center w-10 h-[34px] mx-auto hover:bg-muted"
                        : "gap-2 px-3 py-2 bg-background border border-muted-foreground/12 hover:border-muted-foreground/25"
                    }`}
                >
                    <Search className="w-4 h-4 shrink-0" />
                    <span className={`text-xs whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ${effectiveCollapsed ? "max-w-0 opacity-0" : "flex-1 max-w-full opacity-100"}`}>
                        Quick search...
                    </span>
                    <kbd className={`text-[10px] font-mono whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ${effectiveCollapsed ? "max-w-0 opacity-0" : "max-w-[40px] opacity-60"}`}>
                        ⌘K
                    </kbd>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
                {/* Overview */}
                <div className="px-2 mb-0.5">
                    <Link
                        href="/dashboard"
                        onClick={onMobileClose}
                        title={effectiveCollapsed ? "Overview" : undefined}
                        aria-label="Overview"
                        className={`h-10 flex items-center rounded-lg text-sm transition-colors duration-150 ${
                            pathname === "/dashboard"
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        } ${effectiveCollapsed ? "justify-center w-10 mx-auto" : "gap-2.5 px-3 w-full"}`}
                    >
                        <LayoutDashboard className="w-4 h-4 shrink-0" />
                        <span className={`font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ${
                            effectiveCollapsed ? "max-w-0 opacity-0" : "flex-1 max-w-[180px] opacity-100"
                        }`}>
                            Overview
                        </span>
                    </Link>
                </div>

                {/* Recent pages */}
                <SidebarRecentNav collapsed={effectiveCollapsed} onLinkClick={onMobileClose} />

                {groups.map((group) => (
                    <NavSection
                        key={group.id}
                        group={group}
                        role={user?.role ?? "hr"}
                        collapsed={effectiveCollapsed}
                        pathname={pathname}
                        expanded={expandedGroups.has(group.id)}
                        onToggle={() => toggle(group.id)}
                        onLinkClick={onMobileClose}
                    />
                ))}
                {showVersionsStandalone && (
                    <NavStandaloneVersions
                        collapsed={effectiveCollapsed}
                        pathname={pathname}
                        onLinkClick={onMobileClose}
                    />
                )}
            </nav>

            {!isMobile && (
                <button
                    onClick={() => onCollapseChange(!collapsed)}
                    className="mx-3 mb-2 h-8 rounded-lg border border-muted-foreground/10 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
                </button>
            )}
        </aside>
    );
}

/* ── NavSection ─────────────────────────────────────────────────────────── */

function NavSection({
    group, role, collapsed, pathname, expanded, onToggle, onLinkClick,
}: {
    group: NavGroup; role: UserRole; collapsed: boolean; pathname: string;
    expanded: boolean; onToggle: () => void; onLinkClick?: () => void;
}) {
    const links = visibleLinksFor(group, role);
    const hasActive = links.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"));
    const GroupIcon = group.triggerIcon ?? links[0]?.icon;

    if (!GroupIcon || links.length === 0) return null;

    return (
        <div className="px-2 mb-0.5">
            {/* Section label — opacity-only so height is constant (zero layout shift on hover-expand) */}
            {group.sectionLabel && (
                <div className="relative px-3 pt-4 pb-1">
                    {/* Divider shown in collapsed mode — absolute so it doesn't affect height */}
                    <div className={`absolute inset-x-2 top-2 h-0.5 rounded-full bg-muted-foreground/25 transition-opacity duration-200 ${
                        collapsed ? "opacity-100" : "opacity-0"
                    }`} />
                    {/* Section label shown in expanded mode */}
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground select-none transition-opacity duration-200 ${
                        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}>
                        {group.sectionLabel}
                    </p>
                </div>
            )}

            {/* Single <Link> element — same type in both modes, no React remount, no useRouter hydration delta */}
            {/* collapsed: navigates to first sub-link; expanded: preventDefault + toggles accordion */}
            <Link
                href={links[0].href}
                onClick={(e) => {
                    if (!collapsed) {
                        e.preventDefault();
                        onToggle();
                    } else {
                        onLinkClick?.();
                    }
                }}
                title={collapsed ? group.label : undefined}
                aria-label={group.label}
                className={`h-10 flex items-center rounded-lg text-sm transition-[width,margin,padding,color,background-color] duration-200 ${
                    collapsed
                        ? `justify-center w-10 mx-auto ${
                            hasActive ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`
                        : `w-full gap-2.5 px-3 ${
                            hasActive && !expanded
                                ? "text-foreground bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`
                }`}
                style={hasActive ? { color: group.accentColor } : undefined}
            >
                <GroupIcon
                    className="w-4 h-4 shrink-0"
                    style={{ color: hasActive ? group.accentColor : undefined }}
                />
                {/* Label text — CSS-transitioned, no DOM swap */}
                <span className={`font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 text-left ${
                    collapsed ? "max-w-0 opacity-0" : "flex-1 max-w-[180px] opacity-100"
                }`}>
                    {group.label}
                </span>
                {/* Chevron — CSS-transitioned */}
                <ChevronRight className={`shrink-0 w-3.5 h-3.5 overflow-hidden transition-[transform,opacity,max-width] duration-200 ${
                    collapsed ? "max-w-0 opacity-0" : `max-w-[16px] opacity-40 ${expanded ? "rotate-90" : ""}`
                }`} />
            </Link>

            {/* Sub-items */}
            {!collapsed && expanded && (
                <div className="ml-[22px] pl-3 border-l border-muted-foreground/15 mt-0.5 mb-1 space-y-0.5">
                    {links.map((link) => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onLinkClick}
                                className={`block py-1.5 px-2 rounded-md text-sm transition-colors ${
                                    active
                                        ? "font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                style={active ? { color: group.accentColor } : undefined}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── NavStandaloneVersions ──────────────────────────────────────────────── */

function NavStandaloneVersions({
    collapsed, pathname, onLinkClick,
}: {
    collapsed: boolean; pathname: string; onLinkClick?: () => void;
}) {
    const active = pathname === "/dashboard/versions" || pathname.startsWith("/dashboard/versions/");

    return (
        <div className="px-2">
            {/* Section label row — same pattern as NavSection */}
            <div className="relative px-3 pt-4 pb-1">
                <div className={`absolute inset-x-2 top-2 h-0.5 rounded-full bg-muted-foreground/25 transition-opacity duration-200 ${
                    collapsed ? "opacity-100" : "opacity-0"
                }`} />
                <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground select-none transition-opacity duration-200 ${
                    collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}>
                    System
                </p>
            </div>
            <Link
                href="/dashboard/versions"
                onClick={onLinkClick}
                title={collapsed ? "Versions" : undefined}
                aria-label="Versions"
                className={`h-10 flex items-center rounded-lg text-sm font-medium transition-[width,margin,padding,color,background-color] duration-200 ${
                    collapsed
                        ? `justify-center w-10 mx-auto ${active ? "" : "text-muted-foreground hover:text-muted hover:bg-muted"}`
                        : `w-full gap-2.5 px-3 ${active ? "bg-ai/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                }`}
                style={active ? { color: "var(--ai)" } : undefined}
            >
                <GitBranch className="w-4 h-4 shrink-0" style={active ? { color: "var(--ai)" } : undefined} />
                <span className={`whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ${
                    collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
                }`}>
                    Versions
                </span>
            </Link>
        </div>
    );
}

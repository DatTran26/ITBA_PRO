"use client";
import { alpha } from "@/lib/utils";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, ChevronDown, GitBranch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/ui/notification-bell";
import NavbarUserDropdown from "@/components/ui/navbar-user-dropdown";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    visibleGroupsFor,
    visibleLinksFor,
    shouldShowVersionsStandalone,
    type NavGroup,
    type UserRole,
} from "@/components/ui/nav-config";
import { useUiLayout } from "@/components/ui/ui-layout-context";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface AppNavbarProps {
    /** Breadcrumb trail after logo. Last item = current page (no link). */
    breadcrumbs?: BreadcrumbItem[];
    /** Override user data (avoids refetch when parent already has it) */
    user?: { name: string; email: string; role: string } | null;
    /** Show notification bell (default: true) */
    showNotifications?: boolean;
}

export function AppLogo({ showText = true }: { showText?: boolean }) {
    return (
        <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary via-primary to-ai flex items-center justify-center text-white font-black text-[12px] shadow-lg shadow-primary/20 ring-2 ring-white/10 shrink-0">
                AI
            </div>
            {showText && (
                <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight text-foreground leading-none font-display">
                        ITBA
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-[0.1em] uppercase mt-1">AI Recruitment</span>
                </div>
            )}
        </Link>
    );
}

/**
 * Renders a top-nav entry for a NavGroup. Single-link groups render as a flat
 * Link; multi-link groups render as a dropdown. Active state uses the group's
 * accent color via inline style (Tailwind JIT can't infer dynamic hex colors).
 */
function NavGroupEntry({ group, pathname, role }: { group: NavGroup; pathname: string; role: UserRole }) {
    const TriggerIcon = group.triggerIcon;
    const links = visibleLinksFor(group, role);
    const isActive = links.some((l) => pathname.startsWith(l.href));
    const accent = group.accentColor;

    /* Single-link group → flat link (e.g. Interviews). */
    if (links.length === 1) {
        const only = links[0];
        const LinkIcon = only.icon;
        return (
            <div className="hidden md:block shrink-0">
                <Link
                    href={only.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    style={
                        isActive
                            ? { backgroundColor: `${alpha(accent, 15)}`, color: accent }
                            : undefined
                    }
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {group.label}
                </Link>
            </div>
        );
    }

    return (
        <div className="hidden md:block shrink-0">
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors outline-none cursor-pointer text-muted-foreground hover:text-muted hover:bg-muted focus:text-muted focus:bg-muted data-[state=open]:bg-muted"
                    style={
                        isActive
                            ? { backgroundColor: `${alpha(accent, 15)}`, color: accent }
                            : undefined
                    }
                >
                    {TriggerIcon && <TriggerIcon className="w-3.5 h-3.5" />}
                    {group.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-48 bg-sidebar border border-muted-foreground/10 shadow-xl shadow-black/40 py-1 z-50 rounded-xl"
                >
                    {links.map(({ href, label, icon: Icon }) => {
                        const itemActive = pathname.startsWith(href);
                        return (
                            <Link key={href} href={href} className="block no-underline">
                                <DropdownMenuItem
                                    className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer rounded-lg mx-1 text-muted-foreground hover:text-muted hover:bg-muted focus:text-muted focus:bg-muted"
                                    style={
                                        itemActive
                                            ? { backgroundColor: `${alpha(accent, 10)}`, color: accent }
                                            : undefined
                                    }
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {label}
                                </DropdownMenuItem>
                            </Link>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

/* Standalone Versions link for hr/interviewer/recruiter (Versions appears in
 * System group too, but those roles don't see System). */
function VersionsStandaloneLink({ pathname }: { pathname: string }) {
    const isActive = pathname.startsWith("/dashboard/versions");
    return (
        <div className="hidden md:block shrink-0">
            <Link
                href="/dashboard/versions"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? "bg-ai/15 text-ai" : "text-muted-foreground hover:text-muted hover:bg-muted"}`}
            >
                <GitBranch className="w-3.5 h-3.5" />
                Versions
            </Link>
        </div>
    );
}

export default function AppNavbar({
    user: userProp,
    showNotifications = true,
}: AppNavbarProps) {
    const [user, setUser] = useState(userProp ?? null);
    const pathname = usePathname();
    const role = user?.role as UserRole | undefined;
    const groups = visibleGroupsFor(role);
    const layout = useUiLayout();

    /* Self-suppress in sidebar layout — NavShell renders sidebar chrome.
     * Outside dashboard (no provider), useUiLayout returns "topnav" so
     * standalone usage (login pages, etc.) keeps current behavior. */
    if (layout === "sidebar") return null;

    /* Fetch user data client-side if not provided via props */
    useEffect(() => {
        if (userProp !== undefined) return;
        let cancelled = false;
        async function fetchUser() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser || cancelled) return;
            const { data } = await supabase.from("users").select("name, email, role").eq("auth_id", authUser.id).single();
            if (data && !cancelled) setUser({ name: data.name, email: data.email, role: data.role });
        }
        fetchUser();
        return () => { cancelled = true; };
    }, [userProp]);

    /* Sync when parent updates user prop */
    useEffect(() => {
        if (userProp !== undefined) setUser(userProp);
    }, [userProp]);

    return (
        <div className="fixed top-4 left-4 right-4 z-50">
            <nav className="glass-card max-w-[88rem] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 transition-all duration-300">
                {/* ── Left: Logo ── */}
                <div className="flex items-center gap-1 shrink-0">
                    <AppLogo />
                </div>

                {/* ── Group entries (config-driven) ── */}
                {groups.map((group) => (
                    <NavGroupEntry key={group.id} group={group} pathname={pathname} role={role ?? "hr"} />
                ))}

                {/* ── Standalone Versions for non-System roles ── */}
                {shouldShowVersionsStandalone(role) && (
                    <VersionsStandaloneLink pathname={pathname} />
                )}

                <div className="flex-1" />

                {/* ── Right: Actions ── */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Help icon */}
                    <button
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                        title="Help & Support"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    {/* Notifications */}
                    {showNotifications && <NotificationBell userRole={user?.role} />}

                    {/* Divider */}
                    <div className="w-px h-6 bg-muted-foreground/10 mx-1 hidden sm:block" />

                    {/* User dropdown */}
                    <NavbarUserDropdown user={user} />

                </div>
            </nav>
        </div>
    );
}

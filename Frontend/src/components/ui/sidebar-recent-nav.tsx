"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, ChevronDown } from "lucide-react";
import { NAV_GROUPS } from "@/components/ui/nav-config";

interface RecentPage { href: string; label: string; groupLabel: string; }

const STORAGE_KEY = "sidebar_recent_pages";
const MAX_STORE   = 8;

function resolveEntry(path: string): { label: string; groupLabel: string } | null {
    if (path === "/dashboard") return { label: "Overview", groupLabel: "Dashboard" };
    for (const group of NAV_GROUPS) {
        for (const link of group.links) {
            if (path === link.href || path.startsWith(link.href + "/")) {
                return { label: link.label, groupLabel: group.label };
            }
        }
    }
    return null;
}

function readStored(): RecentPage[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
    catch { return []; }
}

function pushPage(path: string, entry: { label: string; groupLabel: string }) {
    const pages = readStored().filter(p => p.href !== path);
    pages.unshift({ href: path, ...entry });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pages.slice(0, MAX_STORE))); }
    catch {}
}

interface Props { collapsed: boolean; onLinkClick?: () => void; }

export default function SidebarRecentNav({ collapsed, onLinkClick }: Props) {
    const pathname  = usePathname();
    const prevPath  = useRef<string | null>(null);
    const [recent,  setRecent]  = useState<RecentPage[]>([]);
    const [open,    setOpen]    = useState(true);

    useEffect(() => {
        if (pathname === prevPath.current) return;
        prevPath.current = pathname;
        const entry = resolveEntry(pathname);
        if (entry) pushPage(pathname, entry);
        queueMicrotask(() => setRecent(readStored().filter(p => p.href !== pathname).slice(0, 3)));
    }, [pathname]);

    if (recent.length === 0) return null;

    /* ── Collapsed mode: single clock icon, no list ── */
    if (collapsed) {
        return (
            <div className="px-2 mb-1 flex justify-center">
                <div className="w-10 h-8 flex items-center justify-center text-[#8B99B0]">
                    <Clock className="w-3.5 h-3.5" />
                </div>
            </div>
        );
    }

    /* ── Expanded mode ── */
    return (
        <div className="px-2 mb-1">
            {/* Collapsible header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2 px-3 pt-3 pb-1.5 text-[#8B99B0] hover:text-[#ECF0F7] transition-colors cursor-pointer"
            >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] select-none flex-1 text-left">
                    Recents
                </span>
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </button>

            {/* Items — left border line matching nav sub-items */}
            {open && (
                <div className="ml-[22px] pl-3 border-l border-[#8B99B0]/15 mt-0.5 mb-1 space-y-0.5">
                    {recent.map((page) => (
                        <Link
                            key={page.href}
                            href={page.href}
                            onClick={onLinkClick}
                            className="flex flex-col py-1.5 px-2 rounded-md hover:bg-[#1A2236] transition-colors duration-150 cursor-pointer group"
                        >
                            <span className="text-[13px] font-medium text-[#8B99B0] group-hover:text-[#ECF0F7] transition-colors leading-snug truncate">
                                {page.label}
                            </span>
                            <span className="text-[11px] text-[#4A5A72] leading-snug truncate">
                                {page.groupLabel}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

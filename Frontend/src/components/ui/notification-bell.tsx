"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, UserCheck, Sparkles, ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";
import { useNotifications, type Notification } from "@/hooks/use-notifications";

/* ── component ── */

interface NotificationBellProps {
    userRole?: string;
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
    const { notifications, unreadCount, markAllRead, clearAll, markRead } = useNotifications(userRole);
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    /* Close on outside click */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const formatTime = (iso: string) => {
        return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    };

    const iconForType = (type: Notification["type"]) => {
        switch (type) {
            case "candidate_completed": return <UserCheck className="w-4 h-4 text-[#36DDAB]" />;
            case "version_pending":     return <GitBranch className="w-4 h-4 text-[#B48EFF]" />;
            case "version_approved":    return <Sparkles className="w-4 h-4 text-[#7C8FFF]" />;
        }
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840] transition-all cursor-pointer"
                aria-label="Notifications"
            >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FF6B82] text-white text-[10px] font-bold px-1 ring-2 ring-[#101828]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#151D2E] border border-[#8B99B0]/15 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#8B99B0]/10">
                        <span className="text-sm font-semibold text-[#ECF0F7]">Notifications</span>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button onClick={clearAll} className="text-[10px] text-[#5A6882] hover:text-[#FF6B82] transition-colors cursor-pointer">
                                    Clear all
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-0.5 text-[#5A6882] hover:text-[#8B99B0] transition-colors cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-[#5A6882]">
                                <Bell className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const inner = (
                                    <div
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-[#8B99B0]/5 transition-colors cursor-pointer ${
                                            n.read ? "bg-transparent hover:bg-[#1E2840]/50" : "bg-[#7C8FFF]/[0.04] hover:bg-[#7C8FFF]/[0.08]"
                                        }`}
                                        onClick={() => markRead(n.id)}
                                    >
                                        <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-[#1E2840] flex items-center justify-center">
                                            {iconForType(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-sm font-medium truncate ${n.read ? "text-[#8B99B0]" : "text-[#ECF0F7]"}`}>
                                                    {n.title}
                                                </p>
                                                {n.href && <ExternalLink className="w-3 h-3 text-[#5A6882] shrink-0" />}
                                            </div>
                                            <p className="text-xs text-[#5A6882] mt-0.5 truncate">{n.description}</p>
                                            <p className="text-[10px] text-[#5A6882]/60 mt-1">{formatTime(n.timestamp)}</p>
                                        </div>
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full bg-[#7C8FFF] mt-2 shrink-0" />
                                        )}
                                    </div>
                                );
                                return n.href ? (
                                    <Link key={n.id} href={n.href} onClick={() => setIsOpen(false)}>
                                        {inner}
                                    </Link>
                                ) : (
                                    <div key={n.id}>{inner}</div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

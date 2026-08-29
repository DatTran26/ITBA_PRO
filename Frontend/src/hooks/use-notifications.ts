import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── types ── */

export interface Notification {
    id: string;
    type: "candidate_completed" | "version_pending" | "version_approved" | "interview_assigned";
    title: string;
    description: string;
    href?: string;
    timestamp: string;
    read: boolean;
}

/* ── constants ── */

const POLL_INTERVAL = 15_000; // 15 seconds for more responsive notifications (Recruiter/Admin)
const MAX_NOTIFICATIONS = 20;
const STORAGE_KEY = "itba_notifications";
const LAST_CHECK_KEY = "itba_last_notification_check";
const SEEN_VERSION_IDS_KEY = "itba_seen_version_ids";
const LAST_INTERVIEW_CHECK_KEY = "itba_last_interview_check";

/* ── hook ── */

export function useNotifications(userRole?: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const isSuperAdmin = userRole === "super_admin";

    /* Load stored notifications on mount — exclude version_approved (DB-backed) */
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed: Notification[] = JSON.parse(stored);
                setNotifications(parsed.filter((n) => n.type !== "version_approved"));
            } catch { /* ignore corrupt data */ }
        }
    }, []);

    /* Persist to localStorage — exclude version_approved (source of truth is DB) */
    useEffect(() => {
        const persistable = notifications.filter((n) => n.type !== "version_approved");
        if (persistable.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [notifications]);

    /* Poll for new completed results (all roles) */
    const checkForNewResults = useCallback(async () => {
        try {
            const lastCheck = localStorage.getItem(LAST_CHECK_KEY) || new Date(Date.now() - 60_000).toISOString();
            const supabase = createClient();

            const { data: newResults } = await supabase
                .from("results")
                .select("id, candidate_name, candidate_email, submitted_at, tests(title, job_role, level)")
                .gt("submitted_at", lastCheck)
                .order("submitted_at", { ascending: false })
                .limit(5);

            if (newResults && newResults.length > 0) {
                const newNotifs: Notification[] = newResults.map((r) => {
                    const test = Array.isArray(r.tests) ? r.tests[0] : r.tests;
                    return {
                        id: `result-${r.id}`,
                        type: "candidate_completed" as const,
                        title: `${r.candidate_name} completed a test`,
                        description: test ? `${test.title || test.job_role} · ${test.level}` : "Test completed",
                        href: `/dashboard/results/${r.id}`,
                        timestamp: r.submitted_at,
                        read: false,
                    };
                });
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const unique = newNotifs.filter((n) => !existingIds.has(n.id));
                    return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
                });
            }
            localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
        } catch { /* silent fail */ }
    }, []);

    /* Poll for pending versions (super_admin only) */
    const checkForPendingVersions = useCallback(async () => {
        if (!isSuperAdmin) return;
        try {
            const supabase = createClient();
            const { data: pendingVersions } = await supabase
                .from("versions")
                .select("id, version_number, title, created_at")
                .eq("status", "pending")
                .order("created_at", { ascending: false })
                .limit(5);

            if (pendingVersions && pendingVersions.length > 0) {
                const seenIds: string[] = JSON.parse(localStorage.getItem(SEEN_VERSION_IDS_KEY) || "[]");
                const unseen = pendingVersions.filter((v) => !seenIds.includes(v.id));

                if (unseen.length > 0) {
                    const versionNotifs: Notification[] = unseen.map((v) => ({
                        id: `version-${v.id}`,
                        type: "version_pending" as const,
                        title: `v${v.version_number} — ${v.title}`,
                        description: "Có version mới chờ bạn duyệt. Nhấn để xem chi tiết.",
                        href: "/dashboard/versions",
                        timestamp: v.created_at,
                        read: false,
                    }));
                    setNotifications((prev) => {
                        const existingIds = new Set(prev.map((n) => n.id));
                        const unique = versionNotifs.filter((n) => !existingIds.has(n.id));
                        return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
                    });
                    localStorage.setItem(SEEN_VERSION_IDS_KEY, JSON.stringify([...seenIds, ...unseen.map((v) => v.id)]));
                }
            }
        } catch { /* silent fail */ }
    }, [isSuperAdmin]);

    /* Poll for approved versions (everyone) */
    const checkForApprovedVersions = useCallback(async () => {
        try {
            const res = await fetch("/api/versions/unread");
            if (!res.ok) return;
            const { versions } = await res.json();

            if (versions && versions.length > 0) {
                const newNotifs: Notification[] = versions.map((v: {
                    id: string;
                    version_number: string;
                    title: string;
                    description: string;
                    approved_at: string;
                }) => ({
                    id: `version-approved-${v.id}`,
                    type: "version_approved" as const,
                    title: `v${v.version_number} — ${v.title}`,
                    description: v.description
                        ? v.description.slice(0, 80) + (v.description.length > 80 ? "..." : "")
                        : "A new version has been approved",
                    href: "/dashboard/versions",
                    timestamp: v.approved_at,
                    read: false,
                }));
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const unique = newNotifs.filter((n) => !existingIds.has(n.id));
                    return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
                });
            }
        } catch { /* silent */ }
    }, [isSuperAdmin]);

    /* Poll for new interview assignments (interviewer role only) */
    const checkForNewInterviewAssignments = useCallback(async () => {
        if (userRole !== "interviewer") return;
        try {
            const lastCheck = localStorage.getItem(LAST_INTERVIEW_CHECK_KEY)
                || new Date(Date.now() - 60_000).toISOString();

            const supabase = createClient();
            const { data: newSchedules } = await supabase
                .from("interview_schedules")
                .select(`
                    id,
                    scheduled_at,
                    job_applications (
                        persons ( full_name ),
                        job_descriptions ( title )
                    )
                `)
                .eq("interviewer_status", "pending")
                .gt("created_at", lastCheck)
                .order("created_at", { ascending: false })
                .limit(5);

            if (newSchedules && newSchedules.length > 0) {
                const newNotifs: Notification[] = newSchedules.map((s) => {
                    const app = Array.isArray(s.job_applications) ? s.job_applications[0] : s.job_applications;
                    const candidateName = (app as { persons?: { full_name?: string } } | null)?.persons?.full_name ?? "Ứng viên";
                    const jdTitle = (app as { job_descriptions?: { title?: string } } | null)?.job_descriptions?.title ?? "Vị trí chưa xác định";
                    return {
                        id: `interview-${s.id}`,
                        type: "interview_assigned" as const,
                        title: `Lịch phỏng vấn mới: ${candidateName}`,
                        description: `${jdTitle} · ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(s.scheduled_at))}`,
                        href: "/dashboard/interviews",
                        timestamp: s.scheduled_at,
                        read: false,
                    };
                });
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const unique = newNotifs.filter((n) => !existingIds.has(n.id));
                    return [...unique, ...prev].slice(0, MAX_NOTIFICATIONS);
                });
            }
            localStorage.setItem(LAST_INTERVIEW_CHECK_KEY, new Date().toISOString());
        } catch { /* silent fail */ }
    }, [userRole]);

    /* Polling — wait until userRole is resolved to avoid super_admin race on mount */
    useEffect(() => {
        if (userRole === undefined) return;
        checkForNewResults();
        checkForPendingVersions();
        checkForApprovedVersions();
        checkForNewInterviewAssignments();
        const interval = setInterval(() => {
            checkForNewResults();
            checkForPendingVersions();
            checkForApprovedVersions();
            checkForNewInterviewAssignments();
        }, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [userRole, checkForNewResults, checkForPendingVersions, checkForApprovedVersions, checkForNewInterviewAssignments]);

    /* Mark all read — derive IDs from committed state to avoid stale snapshot */
    const markAllRead = useCallback(() => {
        let ids: string[] = [];
        setNotifications((prev) => {
            ids = prev
                .filter((n) => !n.read && n.type === "version_approved")
                .map((n) => n.id.replace("version-approved-", ""));
            return prev.map((n) => ({ ...n, read: true }));
        });
        setTimeout(() => {
            if (ids.length > 0) {
                fetch("/api/versions/unread", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ version_ids: ids }),
                }).catch(() => {});
            }
        }, 0);
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

        // If it's a version approved notification, sync to DB
        if (id.startsWith("version-approved-")) {
            const versionId = id.replace("version-approved-", "");
            fetch("/api/versions/unread", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ version_ids: [versionId] }),
            }).catch(() => {});
        }
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount, markAllRead, clearAll, markRead };
}

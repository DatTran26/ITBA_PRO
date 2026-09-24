"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X, Sparkles, ArrowUpCircle } from "lucide-react";
import { useAppUpdateWatcher } from "@/hooks/use-app-update-watcher";
import { createClient } from "@/lib/supabase/client";

// Shown when a new deployment is detected — lets user refresh on their own terms
// RE-DESIGNED: v1.4.2 - Positioned below header with prominent version badge
export default function AppUpdateBanner() {
    const { updateAvailable, serverVersion } = useAppUpdateWatcher();
    const [dismissed, setDismissed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 1. Handle mounting to avoid hydration mismatch with localStorage
    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));

        // 2. Check initial auth session
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
        });

        // 3. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session);
        });

        return () => {
            cancelAnimationFrame(frame);
            subscription.unsubscribe();
        };
    }, []);

    // 4. Check if this version is already dismissed in localStorage
    useEffect(() => {
        if (!mounted || !serverVersion) return;
        const dismissedVersion = localStorage.getItem("app_update_dismissed");
        if (dismissedVersion === serverVersion) {
            queueMicrotask(() => setDismissed(true));
        } else {
            queueMicrotask(() => setDismissed(false));
        }
    }, [mounted, serverVersion]);

    const handleDismiss = () => {
        if (serverVersion) {
            localStorage.setItem("app_update_dismissed", serverVersion);
        }
        setDismissed(true);
    };

    const handleUpdate = () => {
        if (serverVersion) {
            // Also mark as dismissed so if the reload still fetches the old version, the banner stays hidden
            localStorage.setItem("app_update_dismissed", serverVersion);
        }
        window.location.reload();
    };

    // Hide if not mounted yet (hydration), not logged in, no update, or manually dismissed
    if (!mounted || !isLoggedIn || !updateAvailable || dismissed) return null;

    return (
        <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[100] w-full max-w-[500px] px-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative group">
                {/* Glow Background - RED/YELLOW */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-danger via-warning to-danger rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>

                <div className="relative flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-warning/20 shadow-2xl">
                    <div className="flex items-center gap-3.5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-danger/20 to-warning/20 border border-warning/30 flex items-center justify-center shadow-inner">
                            <ArrowUpCircle className="w-5 h-5 text-warning" />
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-white tracking-wide">
                                    Nâng cấp hệ thống
                                </span>
                                {serverVersion && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-warning text-black text-[10px] font-black uppercase tracking-tighter shadow-sm">
                                        {serverVersion}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-primary/70 leading-tight mt-0.5">
                                Phiên bản mới đã sẵn sàng để trải nghiệm
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleUpdate}
                            className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-danger to-danger text-white text-[11px] font-bold hover:shadow-[0_0_20px_color-mix(in_srgb,var(--danger)_40%,transparent)] transition-all duration-300 shadow-lg cursor-pointer overflow-hidden active:scale-95"
                        >
                            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" />
                            Cập nhật ngay
                            <Sparkles className="absolute -right-1 -top-1 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

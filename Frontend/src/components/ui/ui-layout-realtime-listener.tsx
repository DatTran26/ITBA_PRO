"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { tryCreateClient } from "@/lib/supabase/client";
import { useSetLayout } from "@/components/ui/ui-layout-context";
import type { UiLayout } from "@/lib/settings/ui-layout";

interface UiLayoutRealtimeListenerProps {
    currentLayout: UiLayout;
}

/**
 * Subscribes to postgres_changes on system_settings filtered to ui_layout.
 * On change: updates layout state in UiLayoutContext directly (no server
 * roundtrip) so the NavShell re-renders immediately without a page refresh.
 *
 * Mounted globally inside dashboard layout so subscription persists across
 * route transitions and is cleaned up on logout / navigation away.
 */
export default function UiLayoutRealtimeListener({ currentLayout }: UiLayoutRealtimeListenerProps) {
    const setLayout = useSetLayout();
    const lastValueRef = useRef<UiLayout>(currentLayout);

    useEffect(() => {
        lastValueRef.current = currentLayout;
    }, [currentLayout]);

    useEffect(() => {
        const supabase = tryCreateClient();
        if (!supabase) return;
        const channel = supabase
            .channel("ui-layout-changes")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "system_settings",
                    filter: "key=eq.ui_layout",
                },
                (payload) => {
                    const raw = (payload.new as { value?: unknown } | null)?.value;
                    const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
                    const next: UiLayout = rawStr === "sidebar" ? "sidebar" : "topnav";
                    if (next === lastValueRef.current) return;
                    lastValueRef.current = next;
                    toast.info("Navigation layout updated. Applying in 2s…");
                    setTimeout(() => {
                        setLayout(next);
                    }, 2000);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

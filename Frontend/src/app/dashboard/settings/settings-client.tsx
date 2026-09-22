"use client";
import { alpha } from "@/lib/utils";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Settings, Brain, ClipboardList, BarChart2, CheckCircle2, Loader2, Palette } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { SettingRow, type SystemSetting } from "./setting-row";
import UiLayoutToggle from "./ui-layout-toggle";
import type { UiLayout } from "@/lib/settings/ui-layout";

const APPEARANCE_CATEGORY = "appearance";

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
    ai:         { icon: Brain,         color: "var(--ai)", gradient: "from-ai/20 to-primary/5" },
    assessment: { icon: ClipboardList, color: "var(--primary)", gradient: "from-primary/20 to-success/5" },
    scoring:    { icon: BarChart2,     color: "var(--success)", gradient: "from-success/20 to-primary/5" },
    appearance: { icon: Palette,       color: "var(--primary)", gradient: "from-primary/20 to-ai/5" },
};

type SaveState = "idle" | "saving" | "saved";

export default function SettingsClient({
    user,
    categories,
}: {
    user: { name: string; email: string; role: string };
    categories: Record<string, SystemSetting[]>;
}) {
    const pendingRef = useRef<Record<string, unknown>>({});
    const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [saveState, setSaveState] = useState<SaveState>("idle");

    const scheduleFlush = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            const updates = { ...pendingRef.current };
            if (Object.keys(updates).length === 0) return;
            pendingRef.current = {};
            setSaveState("saving");
            try {
                const res = await fetch("/api/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ updates }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error ?? "Save failed");
                }
                setSaveState("saved");
                setTimeout(() => setSaveState("idle"), 2000);
                toast.success("Settings saved");
            } catch (e) {
                setSaveState("idle");
                toast.error(e instanceof Error ? e.message : "Failed to save settings");
            }
        }, 800);
    }, []);

    function handleChange(key: string, value: unknown) {
        pendingRef.current[key] = value;
        scheduleFlush();
    }

    const isSuperAdmin = user.role === "super_admin";

    /* Hide the appearance category from non-super_admin (RLS allows admin write
     * but UI scope per brainstorm decision #1: super_admin-only toggle). */
    const visibleCategoryKeys = Object.keys(categories)
        .filter((cat) => cat !== APPEARANCE_CATEGORY || isSuperAdmin)
        .sort();

    /* Extract current ui_layout value for the toggle (safe when category absent). */
    const uiLayoutSetting = categories[APPEARANCE_CATEGORY]?.find((s) => s.key === "ui_layout");
    const currentUiLayout: UiLayout = uiLayoutSetting?.value === "sidebar" ? "sidebar" : "topnav";

    return (
        <PageTransition className="min-h-screen bg-background text-foreground font-body">
            <AppNavbar user={user} />
            <PageContainer>
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-ai/10 border border-border/20 flex items-center justify-center shadow-lg shadow-primary/10">
                            <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                System Settings
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Configure platform behaviour and AI parameters</p>
                        </div>
                    </div>

                    {/* Save state indicator */}
                    <div className="h-8 flex items-center">
                        {saveState === "saving" && (
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-border/20 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                            </span>
                        )}
                        {saveState === "saved" && (
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-border/20">
                                <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                        )}
                    </div>
                </div>

                {/* Category cards */}
                <div className="flex flex-col gap-5">
                    {visibleCategoryKeys.map((cat) => {
                        const meta = CATEGORY_META[cat] ?? { icon: Settings, color: "var(--muted-foreground)", gradient: "from-muted-foreground/10 to-transparent" };
                        const Icon = meta.icon;
                        const isAppearance = cat === APPEARANCE_CATEGORY;
                        return (
                            <div
                                key={cat}
                                className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden shadow-xl shadow-black/20"
                            >
                                {/* Gradient accent header */}
                                <div className={`bg-gradient-to-r ${meta.gradient} px-5 py-4 border-b border-white/[0.04]`}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                                            style={{ backgroundColor: `${alpha(meta.color, 9)}`, border: `1px solid ${alpha(meta.color, 19)}` }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold capitalize tracking-wide" style={{ color: meta.color }}>
                                                {isAppearance ? "Appearance" : cat}
                                            </h2>
                                            <p className="text-[11px] text-muted-foreground">
                                                {isAppearance ? "Navigation Layout" : `${categories[cat].length} settings`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom appearance UI for super_admin; generic rows for others */}
                                {isAppearance ? (
                                    <UiLayoutToggle currentValue={currentUiLayout} />
                                ) : (
                                    <div className="px-1 py-1">
                                        {categories[cat].map((setting) => (
                                            <SettingRow
                                                key={setting.key}
                                                setting={setting}
                                                onChange={handleChange}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {visibleCategoryKeys.length === 0 && (
                        <p className="text-center text-muted-foreground py-20">No settings found.</p>
                    )}
                </div>
            </PageContainer>
        </PageTransition>
    );
}

"use client";

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
import {
    AI_SETTING_ORDER,
    DEFAULT_MODEL,
    modelsFor,
    resolveProvider,
    type AiProvider,
} from "@/lib/ai-providers";

const APPEARANCE_CATEGORY = "appearance";

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
    ai:         { icon: Brain,         color: "#B48EFF", gradient: "from-[#B48EFF]/20 to-[#7C8FFF]/5" },
    assessment: { icon: ClipboardList, color: "#5B6CF0", gradient: "from-[#5B6CF0]/20 to-[#36DDAB]/5" },
    scoring:    { icon: BarChart2,     color: "#36DDAB", gradient: "from-[#36DDAB]/20 to-[#5B6CF0]/5" },
    appearance: { icon: Palette,       color: "#7C8FFF", gradient: "from-[#7C8FFF]/20 to-[#B48EFF]/5" },
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
    const initialProvider = resolveProvider(String(categories.ai?.find((s) => s.key === "ai_provider")?.value ?? "openai"));
    const [provider, setProvider] = useState<AiProvider>(initialProvider);

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
        if (key === "ai_provider") {
            const next = resolveProvider(String(value));
            setProvider(next);
            const currentModel = String(categories.ai?.find((s) => s.key === "ai_model")?.value ?? "");
            if (!modelsFor(next).includes(currentModel)) {
                pendingRef.current.ai_model = DEFAULT_MODEL[next];
            }
        }
        scheduleFlush();
    }

    function orderedSettings(cat: string, rows: SystemSetting[]): SystemSetting[] {
        if (cat !== "ai") return rows;
        return [...rows].sort((a, b) => {
            const ia = AI_SETTING_ORDER.indexOf(a.key);
            const ib = AI_SETTING_ORDER.indexOf(b.key);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });
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
        <PageTransition className="min-h-screen bg-[#0D1526] text-[#ECF0F7] font-body">
            <AppNavbar user={user} />
            <PageContainer>
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B6CF0]/30 to-[#B48EFF]/10 border border-[#5B6CF0]/20 flex items-center justify-center shadow-lg shadow-[#5B6CF0]/10">
                            <Settings className="w-5 h-5 text-[#7C8FFF]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-[#ECF0F7] to-[#8B99B0] bg-clip-text text-transparent">
                                System Settings
                            </h1>
                            <p className="text-sm text-[#5A6882] mt-0.5">Configure platform behaviour and AI parameters</p>
                        </div>
                    </div>

                    {/* Save state indicator */}
                    <div className="h-8 flex items-center">
                        {saveState === "saving" && (
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#5B6CF0]/10 text-[#7C8FFF] border border-[#5B6CF0]/20 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                            </span>
                        )}
                        {saveState === "saved" && (
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#36DDAB]/10 text-[#36DDAB] border border-[#36DDAB]/20">
                                <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                        )}
                    </div>
                </div>

                {/* Category cards */}
                <div className="flex flex-col gap-5">
                    {visibleCategoryKeys.map((cat) => {
                        const meta = CATEGORY_META[cat] ?? { icon: Settings, color: "#8B99B0", gradient: "from-[#8B99B0]/10 to-transparent" };
                        const Icon = meta.icon;
                        const isAppearance = cat === APPEARANCE_CATEGORY;
                        return (
                            <div
                                key={cat}
                                className="rounded-2xl border border-white/[0.06] bg-[#131D30] overflow-hidden shadow-xl shadow-black/20"
                            >
                                {/* Gradient accent header */}
                                <div className={`bg-gradient-to-r ${meta.gradient} px-5 py-4 border-b border-white/[0.04]`}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                                            style={{ backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                                        >
                                            <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold capitalize tracking-wide" style={{ color: meta.color }}>
                                                {isAppearance ? "Appearance" : cat}
                                            </h2>
                                            <p className="text-[11px] text-[#5A6882]">
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
                                        {orderedSettings(cat, categories[cat]).map((setting) => (
                                            <SettingRow
                                                key={setting.key}
                                                setting={
                                                    setting.key === "ai_model"
                                                        ? { ...setting, options: [...modelsFor(provider)] }
                                                        : setting
                                                }
                                                onChange={handleChange}
                                                showTester={setting.key === "ai_provider"}
                                                testerModels={[...modelsFor(provider)]}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {visibleCategoryKeys.length === 0 && (
                        <p className="text-center text-[#5A6882] py-20">No settings found.</p>
                    )}
                </div>
            </PageContainer>
        </PageTransition>
    );
}

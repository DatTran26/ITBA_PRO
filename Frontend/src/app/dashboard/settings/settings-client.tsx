"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Settings, Brain, ClipboardList, BarChart2, CheckCircle2, Loader2, Palette } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { PageTransition } from "@/components/ui/motion-wrapper";
import { SettingRow, type SystemSetting } from "./setting-row";
import { SharedDashboardPageHeader } from "@/components/shares";
import FormSection, { FormSectionNav } from "@/components/shares/form-section";
import type { ToneName } from "@/lib/ui/tones";
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

const CATEGORY_META: Record<string, { icon: typeof Settings; tone: ToneName; label: string }> = {
    ai:         { icon: Brain,         tone: "violet", label: "AI" },
    assessment: { icon: ClipboardList, tone: "blue",   label: "Assessment" },
    scoring:    { icon: BarChart2,     tone: "teal",   label: "Scoring" },
    appearance: { icon: Palette,       tone: "pink",   label: "Appearance" },
    general:    { icon: Settings,      tone: "orange", label: "General" },
};
const metaOf = (cat: string) => CATEGORY_META[cat] ?? { icon: Settings, tone: "gold" as ToneName, label: cat };

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
        <PageTransition className="min-h-screen bg-transparent text-foreground font-body pb-12">
            <AppNavbar user={user} />
            <PageContainer>
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

                <SharedDashboardPageHeader
                    title="System Settings"
                    icon={Settings}
                    badge={{ label: `${visibleCategoryKeys.length} nhóm` }}
                    description="Cấu hình hành vi nền tảng và tham số AI. Thay đổi được lưu tự động."
                    actions={(
                        <div className="h-8 flex items-center" aria-live="polite">
                            {saveState === "saving" && (
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu
                                </span>
                            )}
                            {saveState === "saved" && (
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-success/10 text-success">
                                    <CheckCircle2 className="w-3 h-3" /> Đã lưu
                                </span>
                            )}
                        </div>
                    )}
                />

                <div className="grid gap-6 xl:grid-cols-[13rem_minmax(0,1fr)]">
                    <FormSectionNav
                        items={visibleCategoryKeys.map((cat) => ({ id: `settings-${cat}`, label: metaOf(cat).label, icon: metaOf(cat).icon, tone: metaOf(cat).tone }))}
                    />

                    <div className="flex flex-col gap-5 max-w-4xl">
                        {visibleCategoryKeys.map((cat) => {
                            const meta = metaOf(cat);
                            const isAppearance = cat === APPEARANCE_CATEGORY;
                            return (
                                <FormSection
                                    key={cat}
                                    id={`settings-${cat}`}
                                    icon={meta.icon}
                                    tone={meta.tone}
                                    title={meta.label}
                                    subtitle={isAppearance ? "Bố cục điều hướng" : `${categories[cat].length} thiết lập`}
                                    bodyClassName={isAppearance ? "p-0" : undefined}
                                >
                                    {isAppearance ? (
                                        <UiLayoutToggle currentValue={currentUiLayout} />
                                    ) : (
                                        orderedSettings(cat, categories[cat]).map((setting) => (
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
                                        ))
                                    )}
                                </FormSection>
                            );
                        })}

                        {visibleCategoryKeys.length === 0 && (
                            <p className="text-center text-muted-foreground py-20">Chưa có thiết lập nào.</p>
                        )}
                    </div>
                </div>
            </PageContainer>
        </PageTransition>
    );
}

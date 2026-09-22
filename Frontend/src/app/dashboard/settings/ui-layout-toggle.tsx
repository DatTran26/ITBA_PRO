"use client";

import { useState } from "react";
import { AlertTriangle, Layout as LayoutIcon, PanelLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { UiLayout } from "@/lib/settings/ui-layout";
import { SharedDashboardButton } from "@/components/shares";

interface UiLayoutToggleProps {
    currentValue: UiLayout;
}

/**
 * Super_admin-only control to flip the global navigation layout.
 * Click a card -> confirm modal warns blast radius -> upsert system_settings.
 * Realtime listener (mounted in dashboard layout) propagates the change to
 * all online sessions automatically.
 */
export default function UiLayoutToggle({ currentValue }: UiLayoutToggleProps) {
    const [pending, setPending] = useState<UiLayout | null>(null);
    const [busy, setBusy] = useState(false);

    async function applyChange(value: UiLayout) {
        setBusy(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("system_settings")
            .update({ value: value })
            .eq("key", "ui_layout");
        setBusy(false);
        setPending(null);
        if (error) {
            toast.error(`Failed to update layout: ${error.message}`);
            return;
        }
        toast.success("Navigation layout updated. All sessions refreshing...");
    }

    return (
        <div className="px-5 py-4 space-y-4">
            <p className="text-xs text-muted-foreground">
                Applies globally to all users. Change broadcasts in real time and refreshes online sessions
                within ~2 seconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                <LayoutCard
                    layout="topnav"
                    label="Top Navigation"
                    description="Horizontal bar at top - current default"
                    icon={LayoutIcon}
                    active={currentValue === "topnav"}
                    disabled={busy}
                    onSelect={() => setPending("topnav")}
                />
                <LayoutCard
                    layout="sidebar"
                    label="Sidebar"
                    description="Vertical bar on left - modern UX"
                    icon={PanelLeft}
                    active={currentValue === "sidebar"}
                    disabled={busy}
                    onSelect={() => setPending("sidebar")}
                />
            </div>

            {pending && (
                <ConfirmDialog
                    targetValue={pending}
                    busy={busy}
                    onCancel={() => setPending(null)}
                    onConfirm={() => applyChange(pending)}
                />
            )}
        </div>
    );
}

/* Subcomponents */

function LayoutCard({
    layout,
    label,
    description,
    icon: Icon,
    active,
    disabled,
    onSelect,
}: {
    layout: UiLayout;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    disabled: boolean;
    onSelect: () => void;
}) {
    return (
        <SharedDashboardButton
            type="button"
            onClick={active ? undefined : onSelect}
            disabled={disabled}
            aria-pressed={active}
            aria-label={`Switch to ${label}`}
            className={`p-4 rounded-xl border-2 text-left transition-all disabled:cursor-default ${
                active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
            }`}
            data-layout={layout}
        >
            <div className="flex items-center gap-3 mb-1">
                <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold text-foreground">{label}</span>
                {active && (
                    <span className="ml-auto text-[10px] text-primary uppercase tracking-wider font-semibold">
                        Active
                    </span>
                )}
            </div>
            <p className="text-xs text-muted-foreground pl-8">{description}</p>
        </SharedDashboardButton>
    );
}

function ConfirmDialog({
    targetValue,
    busy,
    onCancel,
    onConfirm,
}: {
    targetValue: UiLayout;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ui-layout-confirm-title"
        >
            <div
                className="relative glass-card w-full max-w-md p-6 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/15 border border-border/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1">
                        <h3 id="ui-layout-confirm-title" className="text-base font-semibold text-foreground">
                            Change navigation layout?
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            This will switch the navigation to{" "}
                            <strong className="text-foreground">
                                {targetValue === "sidebar" ? "Sidebar" : "Top Navigation"}
                            </strong>{" "}
                            for <strong className="text-foreground">all users</strong> immediately. Online
                            sessions will see a refresh notification within 2 seconds.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <SharedDashboardButton
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:cursor-default"
                    >
                        Cancel
                    </SharedDashboardButton>
                    <SharedDashboardButton
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    >
                        {busy ? "Applying..." : "Continue"}
                    </SharedDashboardButton>
                </div>
            </div>
        </div>
    );
}

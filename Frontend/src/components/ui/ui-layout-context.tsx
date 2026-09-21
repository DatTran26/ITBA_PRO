"use client";

import { createContext, useContext } from "react";
import type { UiLayout } from "@/lib/settings/ui-layout";
import type { UserRole } from "@/components/ui/nav-config";

export type NavSessionUser = { name: string; email: string; role: UserRole };

interface UiLayoutContextValue {
    layout: UiLayout;
    setLayout: (layout: UiLayout) => void;
    /** True when mobile drawer is open (sidebar layout, mobile viewport). */
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    user: NavSessionUser | null;
}

const UiLayoutContext = createContext<UiLayoutContextValue | null>(null);

export const UiLayoutProvider = UiLayoutContext.Provider;

/**
 * Returns the active UI layout. Outside a provider — returns "topnav" so
 * legacy pages render their own AppNavbar without surprise. This keeps the
 * migration KISS: pages keep current code; chrome decides what to render.
 */
export function useUiLayout(): UiLayout {
    const ctx = useContext(UiLayoutContext);
    return ctx?.layout ?? "topnav";
}

export function useSetLayout(): (layout: UiLayout) => void {
    const ctx = useContext(UiLayoutContext);
    return ctx?.setLayout ?? (() => {});
}

export function useMobileMenu(): {
    open: boolean;
    setOpen: (open: boolean) => void;
} {
    const ctx = useContext(UiLayoutContext);
    return {
        open: ctx?.mobileMenuOpen ?? false,
        setOpen: ctx?.setMobileMenuOpen ?? (() => {}),
    };
}

export function useNavSessionUser(): NavSessionUser | null {
    return useContext(UiLayoutContext)?.user ?? null;
}

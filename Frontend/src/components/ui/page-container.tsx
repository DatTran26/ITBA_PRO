"use client";

import { useUiLayout } from "@/components/ui/ui-layout-context";

interface PageContainerProps {
    children: React.ReactNode;
    /** Additional className on the <main> wrapper */
    className?: string;
    /** Max width variant */
    maxWidth?: "default" | "narrow";
}

/**
 * Standardized page content wrapper.
 * - default: max-w-[88rem] (dashboard, test detail, result detail)
 * - narrow:  max-w-4xl (create test, forms)
 *
 * Top padding adapts to layout: pt-24 in topnav mode (room for the fixed
 * floating navbar), pt-6 in sidebar mode (content-header is already a
 * sticky 48px strip handled by NavShell).
 */
export default function PageContainer({
    children,
    className = "",
    maxWidth = "default",
}: PageContainerProps) {
    const widthClass = maxWidth === "narrow" ? "max-w-4xl" : "max-w-[88rem]";
    const layout = useUiLayout();
    const topPadding = layout === "sidebar" ? "pt-6" : "pt-24";
    return (
        <main className={`${widthClass} mx-auto px-6 ${topPadding} pb-8 ${className}`}>
            {children}
        </main>
    );
}

"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageBreadcrumbProps {
    breadcrumbs: BreadcrumbItem[];
    /** Override back href. Defaults to second-to-last item's href. */
    backHref?: string;
}

export default function PageBreadcrumb({ breadcrumbs, backHref }: PageBreadcrumbProps) {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;

    const home = breadcrumbs.find((item) => item.href);
    const derivedBack = backHref ?? home?.href;
    const backLabel =
        breadcrumbs.find((item) => item.href === derivedBack)?.label
        ?? breadcrumbs[0]?.label;

    return (
        <div className="py-3 mb-3 space-y-1.5">
            {/* Back link */}
            {derivedBack && (
                <Link
                    href={derivedBack}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A6080] hover:text-[#60A5FA] transition-colors duration-150 cursor-pointer group"
                >
                    <ArrowLeft className="w-3 h-3 transition-transform duration-150 group-hover:-translate-x-0.5" />
                    Back to {backLabel}
                </Link>
            )}

            {/* Breadcrumb trail */}
            <nav aria-label="breadcrumb">
                <ol className="flex items-center gap-0.5 flex-wrap">
                    {breadcrumbs.map((item, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <li key={idx} className="flex items-center gap-0.5">
                                {idx > 0 && (
                                    <ChevronRight className="w-3 h-3 text-[#2A3A52] mx-0.5 flex-shrink-0" />
                                )}
                                {isLast ? (
                                    <span
                                        aria-current="page"
                                        className="text-sm font-semibold text-[#E2E8F0] tracking-wide"
                                    >
                                        {item.label}
                                    </span>
                                ) : item.href ? (
                                    <Link
                                        href={item.href}
                                        className="text-sm text-[#4A6080] hover:text-[#60A5FA] transition-colors duration-150 cursor-pointer"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-sm text-[#4A6080]">{item.label}</span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}

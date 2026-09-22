import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderBreadcrumb {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    breadcrumbs?: PageHeaderBreadcrumb[];
    actions?: React.ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <section className={cn("mb-8", className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {breadcrumbs.map((item, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <div key={`${item.label}-${index}`} className="flex items-center gap-2 min-w-0">
                                {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                {item.href && !isLast ? (
                                    <Link href={item.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="truncate text-foreground">{item.label}</span>
                                )}
                            </div>
                        );
                    })}
                </nav>
            )}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="font-display text-4xl font-bold tracking-normal text-foreground md:text-5xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-muted-foreground md:text-lg">
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
            </div>
        </section>
    );
}

"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

export default function WorkplacePageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <>
      <PageBreadcrumb breadcrumbs={breadcrumbs} backHref="/dashboard" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-light">{title}</h1>
          {description ? <p className="mt-1 text-sm text-[#8B99B0]">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline">
              <Home className="size-4" />
              Home
            </Button>
          </Link>
          {actions}
        </div>
      </div>
    </>
  );
}

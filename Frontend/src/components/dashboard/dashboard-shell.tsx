"use client";

import type { ReactNode } from "react";
import AppNavbar from "@/components/ui/app-navbar";
import PageContainer from "@/components/ui/page-container";
import BackgroundOrbs from "@/components/ui/background-orbs";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardModeTabs from "@/components/dashboard/dashboard-mode-tabs";
import { PageTransition } from "@/components/ui/motion-wrapper";
import type { DashboardMode } from "@/app/dashboard/types";

interface DashboardShellProps {
    user: { name: string; email: string; role: string };
    mode: DashboardMode;
    children: ReactNode;
}

/**
 * Shared frame used by all roles: AppNavbar + DashboardHeader + role-aware tabs.
 * Admin/Recruiter use DashboardClient (which mirrors this structure).
 * HR and Interviewer render their content panels as children here.
 */
export default function DashboardShell({ user, mode, children }: DashboardShellProps) {
    return (
        <PageTransition className="min-h-screen bg-transparent text-foreground font-body pb-12">
            <AppNavbar user={user} />
            <BackgroundOrbs />
            <PageContainer className="relative z-10">
                <DashboardHeader userRole={user.role} />
                <DashboardModeTabs activeMode={mode} role={user.role} />
                {children}
            </PageContainer>
        </PageTransition>
    );
}

"use client";

import HrDashboardClient from "@/app/dashboard/hr-dashboard-client";
import PageContainer from "@/components/ui/page-container";
import NavShell from "@/components/ui/nav-shell";
import ThemeScope from "@/components/ui/theme-scope";
import type { UserRole } from "@/components/ui/nav-config";

export default function DashboardPreviewPage() {
  const dummyUser = {
    name: "Kyle Bentley",
    email: "kyle.hr@itba.ai",
    role: "hr" as UserRole,
  };

  return (
    <ThemeScope>
      <div data-ui-layout="sidebar" className="min-h-screen bg-background text-foreground relative">
        <NavShell
          user={dummyUser}
          layout="sidebar"
          sidebarCollapsed={false}
        >
          <PageContainer className="py-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0077cc] bg-[#cdf5fd] px-3 py-0.5 rounded-full border border-[#a0e9ff]">
                  Bảng điều hành nhân sự
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#264e6b] tracking-tight">
                Chào mừng trở lại, Kyle!
              </h1>
              <p className="text-sm font-medium text-[#6b8ca0] mt-1">
                Tổng quan vận hành quy trình tuyển dụng & nhân sự hôm nay.
              </p>
            </div>

            <HrDashboardClient user={dummyUser} />
          </PageContainer>
        </NavShell>
      </div>
    </ThemeScope>
  );
}

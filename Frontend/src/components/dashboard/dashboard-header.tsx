"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SharedDashboardButton } from "@/components/shares";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { LayoutDashboard, Plus, Sparkles, Upload } from "lucide-react";
import CvUploadDialog from "@/components/recruitment/cv-upload-dialog";

const TEST_CREATE_ROLES = ["recruiter", "interviewer", "admin", "super_admin"];
const CV_UPLOAD_ROLES  = ["admin", "super_admin", "interviewer"];

export default function DashboardHeader({ userRole }: { userRole?: string }) {
    const router = useRouter();
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-6 relative">
            {/* Background Aesthetic Blur */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#7C8FFF]/5 blur-[100px] rounded-full pointer-events-none" />

            <FadeIn>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#7C8FFF]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="pro-icon-box bg-[#7C8FFF]/10 border border-[#7C8FFF]/20 relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                            <LayoutDashboard className="w-5 h-5 text-[#7C8FFF] drop-shadow-[0_0_8px_rgba(124,143,255,0.5)]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl md:text-4xl font-black text-[#ECF0F7] font-display tracking-tight">Dashboard</h1>
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Protocol Active</span>
                            </div>
                        </div>
                        <p className="text-[#5A6882] font-medium text-xs md:text-sm max-w-2xl leading-relaxed mt-1">
                            Trung tâm điều hành tuyển dụng AI — quản lý đánh giá, theo dõi ứng viên và phân tích chuyên sâu.
                        </p>
                    </div>
                </div>
            </FadeIn>

            {(TEST_CREATE_ROLES.includes(userRole ?? "") || userRole === "hr") && (
              <FadeIn delay={0.1}>
                  <div className="flex items-center gap-3">
                      {(CV_UPLOAD_ROLES.includes(userRole ?? "") || userRole === "hr") && (
                          <CvUploadDialog
                              onSuccess={(id) => router.push(`/dashboard/recruitment/${id}`)}
                              trigger={
                                  <SharedDashboardButton
                                      variant="secondary"
                                      leadingIcon={<Upload className="h-4 w-4" />}
                                      labelClassName="text-center leading-tight"
                                  >
                                      Upload CV
                                  </SharedDashboardButton>
                              }
                          />
                      )}
                      {TEST_CREATE_ROLES.includes(userRole ?? "") && (
                          <Link href="/dashboard/create">
                              <SharedDashboardButton
                                  variant="primary"
                                  leadingIcon={<Plus className="h-4 w-4" />}
                                  trailingIcon={<Sparkles className="h-3.5 w-3.5 opacity-70" />}
                              >
                                  Create New Test
                              </SharedDashboardButton>
                          </Link>
                      )}
                  </div>
              </FadeIn>
            )}
        </div>
    );
}

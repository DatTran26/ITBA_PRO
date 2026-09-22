"use client";

import { AlertCircle, Calendar, Clock, ChevronRight, Activity, Sparkles, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import ScheduleInterviewDialog from "@/components/recruitment/schedule-interview-dialog";

interface ActivityEvent {
  type: "cv_analyzed" | "cv_uploaded" | "status_changed" | "interview_scheduled";
  text: string;
  sub: string;
  createdAt: string;
}

interface ActionCenterProps {
  shortlistedCount?: number;
  screenedCount?: number;
  pendingQueue?: number;
  firstShortlistedId?: string;
  activities?: ActivityEvent[];
  onRefresh?: () => void;
}

export default function DashboardActionCenter({
  shortlistedCount = 0,
  screenedCount = 0,
  pendingQueue = 0,
  firstShortlistedId,
  activities = [],
  onRefresh,
}: ActionCenterProps) {
  const totalActions = (shortlistedCount > 0 ? 1 : 0) + (screenedCount > 0 ? 1 : 0) + (pendingQueue > 0 ? 1 : 0);

  return (
    <div className="bg-card border border-[#cde9f5] rounded-2xl p-5 shadow-[0_2px_14px_rgba(0,169,255,0.08)] flex flex-col justify-between h-full min-h-[440px]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#e5f3fa]">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#264e6b]">Action Center</h3>
            {totalActions > 0 && (
              <span className="text-xs font-bold text-[#d62929] bg-[#fdeaea] px-2.5 py-0.5 rounded-full border border-[#ffcdd2]">
                {totalActions} việc gấp
              </span>
            )}
          </div>
          <span className="text-xs text-[#6b8ca0] font-bold">Tác vụ khẩn</span>
        </div>

        {/* Action Priority Items */}
        <div className="space-y-2.5 mt-3.5">
          {/* Item 1: Shortlisted waiting for interview (High) */}
          <div className="p-2.5 rounded-xl border border-[#ffcdd2] bg-[#fdeaea]/50 hover:bg-[#fdeaea] transition-colors flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fdeaea] text-[#d62929] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#264e6b] block truncate">
                  {shortlistedCount > 0
                    ? `${shortlistedCount} ứng viên tiềm năng chờ xếp lịch PV`
                    : "Lên lịch phỏng vấn ứng viên"}
                </span>
                <span className="text-xs text-[#6b8ca0] font-medium block truncate">
                  Ưu tiên cao • Điểm đánh giá AI phù hợp
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#d62929] bg-[#fdeaea] border border-[#ffcdd2] px-2 py-0.5 rounded-md">
                High
              </span>
              {firstShortlistedId ? (
                <ScheduleInterviewDialog
                  applicationId={firstShortlistedId}
                  onSuccess={() => onRefresh?.()}
                  trigger={
                    <button
                      className="p-1 rounded-md text-[#6b8ca0] hover:text-[#0077cc] hover:bg-[#cdf5fd] transition-colors cursor-pointer"
                      title="Lên lịch ngay"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  }
                />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#6b8ca0]" />
              )}
            </div>
          </div>

          {/* Item 2: Screened waiting review (Medium) */}
          <div className="p-2.5 rounded-xl border border-[#ffe0b2] bg-[#fff3e0]/50 hover:bg-[#fff3e0] transition-colors flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fff3e0] text-[#a35b00] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#264e6b] block truncate">
                  {screenedCount > 0
                    ? `${screenedCount} hồ sơ cần HR xác nhận kết quả`
                    : "Kiểm tra kết quả sàng lọc AI"}
                </span>
                <span className="text-xs text-[#6b8ca0] font-medium block truncate">
                  Đã có phân tích điểm kỹ năng & CV
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a35b00] bg-[#fff3e0] border border-[#ffe0b2] px-2 py-0.5 rounded-md">
                Medium
              </span>
              <ChevronRight className="w-4 h-4 text-[#6b8ca0]" />
            </div>
          </div>

          {/* Item 3: Processing queue (Normal) */}
          <div className="p-2.5 rounded-xl border border-[#cde9f5] bg-[#f0faff] hover:bg-[#e5f3fa] transition-colors flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#cdf5fd] text-[#0077cc] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#264e6b] block truncate">
                  {pendingQueue > 0
                    ? `${pendingQueue} hồ sơ đang trong hàng đợi AI`
                    : "Hàng đợi xử lý hồ sơ ổn định"}
                </span>
                <span className="text-xs text-[#6b8ca0] font-medium block truncate">
                  Hệ thống OCR & trích xuất dữ liệu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0077cc] bg-[#cdf5fd] border border-[#a0e9ff] px-2 py-0.5 rounded-md">
                Normal
              </span>
              <ChevronRight className="w-4 h-4 text-[#6b8ca0]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Timeline Stream */}
      <div className="pt-3 border-t border-[#e5f3fa] mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#264e6b] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0077cc]" />
            Hoạt động gần đây
          </span>
          <span className="text-xs text-[#6b8ca0] font-bold">Thời gian thực</span>
        </div>

        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-[11px] text-[#6b8ca0] py-2 text-center">Chưa có sự kiện mới</p>
          ) : (
            activities.slice(0, 2).map((act, idx) => {
              const timeAgo = formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: vi });
              return (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a9ff] shrink-0" />
                    <span className="text-[#264e6b] text-xs font-bold truncate">{act.text}</span>
                  </div>
                  <span className="text-[11px] text-[#6b8ca0] font-mono shrink-0">{timeAgo}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

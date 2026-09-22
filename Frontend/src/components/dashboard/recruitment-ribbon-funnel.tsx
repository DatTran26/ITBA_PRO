"use client";

import { FileText, Filter, Calendar, Handshake, CheckCircle2 } from "lucide-react";

interface RecruitmentRibbonFunnelProps {
  funnel?: Array<{ stage: string; count: number }>;
  avgAiScore?: number;
  offerAcceptanceRate?: number;
  processingQueue?: number;
  interviewsCount?: number;
}

export default function RecruitmentRibbonFunnel({
  funnel = [],
  avgAiScore = 0,
  offerAcceptanceRate = 0,
  processingQueue = 0,
  interviewsCount = 0,
}: RecruitmentRibbonFunnelProps) {
  // Map raw stages to the 5 standard recruitment steps in PeopleFlow reference
  const byStage = Object.fromEntries(funnel.map((f) => [f.stage, f.count]));

  const stages = [
    {
      id: "NEW",
      label: "Tiếp nhận",
      count: byStage["NEW"] ?? 0,
      icon: FileText,
      color: "#0077cc",
      bgMuted: "bg-[#0077cc]/15 text-[#0077cc]",
    },
    {
      id: "SCREENED",
      label: "Sàng lọc",
      count: (byStage["SCREENED"] ?? 0) + (byStage["SHORTLISTED"] ?? 0),
      icon: Filter,
      color: "#00a9ff",
      bgMuted: "bg-[#00a9ff]/15 text-[#0077cc]",
    },
    {
      id: "INTERVIEW",
      label: "Phỏng vấn",
      count: (byStage["INTERVIEW_SCHEDULED"] ?? 0) + (byStage["INTERVIEWED"] ?? 0),
      icon: Calendar,
      color: "#00bcd4",
      bgMuted: "bg-[#00bcd4]/15 text-[#00798a]",
    },
    {
      id: "OFFER",
      label: "Gửi Offer",
      count: byStage["OFFERED"] ?? 0,
      icon: Handshake,
      color: "#14b8a6",
      bgMuted: "bg-[#14b8a6]/15 text-[#0d9488]",
    },
    {
      id: "HIRED",
      label: "Nhận việc",
      count: byStage["ONBOARDED"] ?? (byStage["PASSED"] ?? 0),
      icon: CheckCircle2,
      color: "#2e7d64",
      bgMuted: "bg-[#2e7d64]/15 text-[#2e7d64]",
    },
  ];

  return (
    <div className="bg-card border border-[#cde9f5] rounded-2xl p-5 shadow-[0_2px_14px_rgba(0,169,255,0.08)] flex flex-col justify-between h-full min-h-[440px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e5f3fa]">
        <div>
          <h3 className="text-base font-bold text-[#264e6b]">Tiến Trình Tuyển Dụng</h3>
          <p className="text-xs font-medium text-[#6b8ca0] mt-0.5">Phễu ứng viên & chỉ số vận tốc</p>
        </div>
        <span className="text-xs font-bold text-[#0077cc] px-3 py-0.5 rounded-full bg-[#cdf5fd]">
          Pipeline
        </span>
      </div>

      {/* Top Part: True Connected Chevron Process Ribbon */}
      <div className="py-2">
        {/* Row 1: Labels above chevron ribbon */}
        <div className="grid grid-cols-5 gap-1.5 text-center mb-2">
          {stages.map((stg) => (
            <div
              key={stg.id}
              className="bg-[#f5fbfe] border border-[#e5f3fa] rounded-lg py-1 px-0.5 shadow-2xs"
            >
              <span className="text-xs font-bold text-[#264e6b] truncate block">
                {stg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Row 2: Continuous Interlocking Chevron Arrow Ribbon (SVG) */}
        <div className="relative w-full h-11 filter drop-shadow-xs">
          <svg
            viewBox="0 0 500 44"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Stage 0: Flat left with rounded corners, arrow tip right */}
            <path
              d="M 8 0 L 97.5 0 L 109.5 22 L 97.5 44 L 8 44 Q 0 44 0 36 L 0 8 Q 0 0 8 0 Z"
              fill={stages[0].color}
            />
            {/* Stage 1: Arrow indent left, arrow tip right */}
            <path
              d="M 100 0 L 197.5 0 L 209.5 22 L 197.5 44 L 100 44 L 112 22 Z"
              fill={stages[1].color}
            />
            {/* Stage 2: Arrow indent left, arrow tip right */}
            <path
              d="M 200 0 L 297.5 0 L 309.5 22 L 297.5 44 L 200 44 L 212 22 Z"
              fill={stages[2].color}
            />
            {/* Stage 3: Arrow indent left, arrow tip right */}
            <path
              d="M 300 0 L 397.5 0 L 409.5 22 L 397.5 44 L 300 44 L 312 22 Z"
              fill={stages[3].color}
            />
            {/* Stage 4: Arrow indent left, flat right with rounded corners */}
            <path
              d="M 400 0 L 492 0 Q 500 0 500 8 L 500 36 Q 500 44 492 44 L 400 44 L 412 22 Z"
              fill={stages[4].color}
            />
          </svg>

          {/* Icon Overlay: perfectly centered in 5 columns */}
          <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
            {stages.map((stg) => {
              const Icon = stg.icon;
              return (
                <div key={stg.id} className="flex items-center justify-center text-white">
                  <Icon className="w-4 h-4 opacity-95 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: Big counts directly below chevron ribbon */}
        <div className="grid grid-cols-5 text-center mt-2.5">
          {stages.map((stg) => (
            <span
              key={stg.id}
              className="text-xl font-extrabold text-[#264e6b] tabular-nums"
            >
              {stg.count}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Part: 2x2 Mini Metrics Grid with Sparklines */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#e5f3fa]">
        {/* Metric 1: Avg AI Score */}
        <div className="bg-[#f5fbfe] border border-[#cde9f5] rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#6b8ca0] block">Điểm AI trung bình</span>
            <span className="text-xl font-extrabold text-[#264e6b] tabular-nums">
              {avgAiScore > 0 ? avgAiScore : 78}
            </span>
          </div>
          <svg className="w-16 h-8 text-[#7a5cf0] shrink-0" viewBox="0 0 64 32" fill="none">
            <path
              d="M 4 24 Q 18 10 32 18 T 60 8"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Metric 2: Offer Acceptance */}
        <div className="bg-[#f5fbfe] border border-[#cde9f5] rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#6b8ca0] block">Tỷ lệ nhận Offer</span>
            <span className="text-xl font-extrabold text-[#264e6b] tabular-nums">
              {offerAcceptanceRate > 0 ? `${offerAcceptanceRate}%` : "88%"}
            </span>
          </div>
          <svg className="w-16 h-8 text-[#2e7d64] shrink-0" viewBox="0 0 64 32" fill="none">
            <path
              d="M 4 22 Q 20 26 34 14 T 60 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Metric 3: Processing Queue */}
        <div className="bg-[#f5fbfe] border border-[#cde9f5] rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#6b8ca0] block">Hồ sơ chờ xử lý</span>
            <span className="text-xl font-extrabold text-[#264e6b] tabular-nums">
              {processingQueue}
            </span>
          </div>
          <svg className="w-16 h-8 text-[#a35b00] shrink-0" viewBox="0 0 64 32" fill="none">
            <path
              d="M 4 12 Q 22 8 36 20 T 60 16"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Metric 4: Scheduled Interviews */}
        <div className="bg-[#f5fbfe] border border-[#cde9f5] rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#6b8ca0] block">Lịch phỏng vấn</span>
            <span className="text-xl font-extrabold text-[#264e6b] tabular-nums">
              {interviewsCount > 0 ? interviewsCount : (byStage["INTERVIEW_SCHEDULED"] ?? 5)}
            </span>
          </div>
          <svg className="w-16 h-8 text-[#0077cc] shrink-0" viewBox="0 0 64 32" fill="none">
            <path
              d="M 4 20 Q 20 12 36 16 T 60 10"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

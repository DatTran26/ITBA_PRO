"use client";

import { FileText, Users, Clock, Target, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface BentoMetricStripProps {
  stats: {
    totalCvsUploaded?: number;
    byStatus?: Record<string, number>;
    processingQueue?: number;
    passRate?: number;
    avgAiScore?: number;
    offerAcceptanceRate?: number;
  } | null;
  loading?: boolean;
}

export default function BentoMetricStrip({ stats, loading }: BentoMetricStripProps) {
  const totalCandidates = Object.values(stats?.byStatus ?? {}).reduce((a, b) => a + b, 0);

  const metrics = [
    {
      id: "cvs",
      label: "Hồ Sơ Tiếp Nhận",
      value: stats?.totalCvsUploaded ?? 0,
      icon: FileText,
      iconColor: "text-[#0077cc]",
      iconBg: "bg-[#cdf5fd]",
      badge: "Toàn bộ",
      badgeTone: "text-[#0077cc] bg-[#e5f3fa] font-bold",
    },
    {
      id: "candidates",
      label: "Ứng Viên Đang Xử Lý",
      value: totalCandidates,
      icon: Users,
      iconColor: "text-[#00798a]",
      iconBg: "bg-[#e0f7fa]",
      badge: "Đang chạy",
      badgeTone: "text-[#00798a] bg-[#e0f7fa] font-bold",
    },
    {
      id: "queue",
      label: "Hồ Sơ Chờ Duyệt",
      value: stats?.processingQueue ?? 0,
      icon: Clock,
      iconColor: "text-[#a35b00]",
      iconBg: "bg-[#fff3e0]",
      badge: (stats?.processingQueue ?? 0) > 0 ? "Cần xử lý" : "Trống",
      badgeTone:
        (stats?.processingQueue ?? 0) > 0
          ? "text-[#a35b00] bg-[#fff3e0] font-bold"
          : "text-[#6b8ca0] bg-[#f5fbfe] font-bold",
    },
    {
      id: "passRate",
      label: "Tỷ Lệ Đạt PV",
      value: `${stats?.passRate ?? 0}%`,
      icon: Target,
      iconColor: "text-[#2e7d64]",
      iconBg: "bg-[#e4f5ee]",
      badge: "Vòng phỏng vấn",
      badgeTone: "text-[#2e7d64] bg-[#e4f5ee] font-bold",
    },
    {
      id: "avgAiScore",
      label: "Điểm AI Trung Bình",
      value: stats?.avgAiScore ? `${stats.avgAiScore}` : "—",
      icon: Sparkles,
      iconColor: "text-[#7a5cf0]",
      iconBg: "bg-[#efeafe]",
      badge: stats?.avgAiScore && stats.avgAiScore >= 75 ? "Chất lượng cao" : "Đánh giá chung",
      badgeTone: "text-[#5b3fd1] bg-[#efeafe] font-bold",
    },
    {
      id: "offerRate",
      label: "Chấp Nhận Offer",
      value: `${stats?.offerAcceptanceRate ?? 0}%`,
      icon: TrendingUp,
      iconColor: "text-[#0077cc]",
      iconBg: "bg-[#cdf5fd]",
      badge: "Giai đoạn cuối",
      badgeTone: "text-[#0077cc] bg-[#e5f3fa] font-bold",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[108px] bg-card border border-[#cde9f5] rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.35, ease: "easeOut" }}
            className="bg-card border border-[#cde9f5] rounded-2xl p-4 flex flex-col justify-between shadow-[0_2px_14px_rgba(0,169,255,0.08)] hover:shadow-[0_8px_24px_rgba(0,169,255,0.14)] hover:border-[#a0e9ff] transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#6b8ca0] truncate leading-tight">
                {item.label}
              </span>
              <div
                className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-[28px] font-extrabold tracking-tight text-[#264e6b] tabular-nums leading-none">
                {item.value}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-tight ${item.badgeTone}`}
                >
                  {item.badge}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

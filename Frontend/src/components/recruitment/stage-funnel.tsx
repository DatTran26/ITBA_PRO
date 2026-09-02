"use client";

import { motion } from "framer-motion";
import {
  FileText, Filter as FilterIcon, Sparkles, Calendar,
  CheckCircle2, UserPlus, Award, Handshake
} from "lucide-react";

interface FunnelStage { stage: string; count: number }
interface StageFunnelProps { stages: FunnelStage[] }

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  NEW: { label: "Hồ Sơ Mới", color: "#7C8FFF", icon: FileText },
  SCREENED: { label: "Đã Sàng Lọc", color: "#B48EFF", icon: FilterIcon },
  SHORTLISTED: { label: "Tiềm Năng", color: "#06B6D4", icon: Sparkles },
  INTERVIEW_SCHEDULED: { label: "Lên Lịch PV", color: "#F59E0B", icon: Calendar },
  INTERVIEWED: { label: "Đã Phỏng Vấn", color: "#FFB547", icon: CheckCircle2 },
  PASSED: { label: "Vượt Qua PV", color: "#36DDAB", icon: CheckCircle2 },
  OFFERED: { label: "Gửi Offer", color: "#FF6B82", icon: Handshake },
  ONBOARDED: { label: "Đã Gia Nhập", color: "#22C55E", icon: Award },
};

export default function StageFunnel({ stages }: StageFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-4">
        {stages.map(({ stage, count }, idx) => {
          const pct = (count / maxCount) * 100;
          const config = STAGE_CONFIG[stage] ?? { label: stage, color: "#8B99B0", icon: FileText };
          const Icon = config.icon;

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.08,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon size={10} style={{ color: config.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-[#8B99B0] uppercase tracking-widest group-hover:text-[#ECF0F7] transition-colors">
                    {config.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded-md border border-white/5 shadow-inner"
                  style={{ color: config.color, backgroundColor: `${config.color}10` }}
                >
                  {count}
                </span>
              </div>
              <div className="relative h-3.5 w-full bg-[#121A2E] rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 + idx * 0.08 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: config.color }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {maxCount === 0 || stages.every(s => s.count === 0) ? (
        <div className="flex flex-col items-center justify-center py-10 opacity-20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B99B0]">Chưa có dữ liệu vận hành</p>
        </div>
      ) : null}
    </div>
  );
}

"use client";
import { alpha } from "@/lib/utils";

import { motion } from "framer-motion";
import {
  FileText, Filter as FilterIcon, Sparkles, Calendar,
  CheckCircle2, UserPlus, Award, Handshake
} from "lucide-react";

interface FunnelStage { stage: string; count: number }
interface StageFunnelProps { stages: FunnelStage[] }

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  NEW: { label: "Hồ Sơ Mới", color: "var(--primary)", icon: FileText },
  SCREENED: { label: "Đã Sàng Lọc", color: "var(--ai)", icon: FilterIcon },
  SHORTLISTED: { label: "Tiềm Năng", color: "var(--primary)", icon: Sparkles },
  INTERVIEW_SCHEDULED: { label: "Lên Lịch PV", color: "var(--warning)", icon: Calendar },
  INTERVIEWED: { label: "Đã Phỏng Vấn", color: "var(--warning)", icon: CheckCircle2 },
  PASSED: { label: "Vượt Qua PV", color: "var(--success)", icon: CheckCircle2 },
  OFFERED: { label: "Gửi Offer", color: "var(--danger)", icon: Handshake },
  ONBOARDED: { label: "Đã Gia Nhập", color: "var(--success)", icon: Award },
};

export default function StageFunnel({ stages }: StageFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-4">
        {stages.map(({ stage, count }, idx) => {
          const pct = (count / maxCount) * 100;
          const config = STAGE_CONFIG[stage] ?? { label: stage, color: "var(--muted-foreground)", icon: FileText };
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
                    style={{ backgroundColor: `${alpha(config.color, 8)}` }}
                  >
                    <Icon size={10} style={{ color: config.color }} />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                    {config.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded-md border border-border shadow-inner"
                  style={{ color: config.color, backgroundColor: `${alpha(config.color, 6)}` }}
                >
                  {count}
                </span>
              </div>
              <div className="relative h-3.5 w-full bg-background rounded-full overflow-hidden border border-border p-[1px]">
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chưa có dữ liệu vận hành</p>
        </div>
      ) : null}
    </div>
  );
}

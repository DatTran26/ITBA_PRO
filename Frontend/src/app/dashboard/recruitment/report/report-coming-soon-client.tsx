"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart3, TrendingUp, Users, Clock,
  Sparkles, Download, ArrowLeft, Construction,
  Zap, Target, FileBarChart, Loader2
} from "lucide-react";

const PLANNED_FEATURES = [
  { icon: BarChart3,   label: "Analytics & KPI tuyển dụng",     color: "#7C8FFF", progress: 35 },
  { icon: TrendingUp,  label: "Pipeline & Conversion Reports",   color: "#B48EFF", progress: 22 },
  { icon: Users,       label: "Hiệu suất phỏng vấn viên",       color: "#36DDAB", progress: 15 },
  { icon: Clock,       label: "Time-to-Hire & SLA Metrics",      color: "#FFB547", progress: 10 },
  { icon: Sparkles,    label: "Phân tích điểm AI ứng viên",      color: "#06B6D4", progress: 40 },
  { icon: Download,    label: "Xuất báo cáo PDF / Excel",        color: "#FF6B82", progress: 8  },
];

const FLOAT_DOTS = [
  { x: "8%",  y: "20%", size: 3,  delay: 0,    color: "#7C8FFF" },
  { x: "92%", y: "15%", size: 5,  delay: 0.6,  color: "#B48EFF" },
  { x: "15%", y: "75%", size: 4,  delay: 1.2,  color: "#36DDAB" },
  { x: "85%", y: "70%", size: 3,  delay: 0.3,  color: "#FFB547" },
  { x: "50%", y: "8%",  size: 6,  delay: 0.9,  color: "#06B6D4" },
  { x: "5%",  y: "50%", size: 2,  delay: 1.5,  color: "#7C8FFF" },
  { x: "95%", y: "45%", size: 4,  delay: 0.5,  color: "#36DDAB" },
  { x: "25%", y: "88%", size: 3,  delay: 1.1,  color: "#B48EFF" },
];

export default function ReportComingSoonClient() {
  const [exporting, setExporting] = useState(false);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const res = await fetch("/api/recruitment/report/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-tuyen-dung-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[ReportComingSoonClient] export:", err);
      toast.error("Không thể xuất báo cáo Excel. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-7rem)] flex flex-col items-center justify-start pb-16 overflow-hidden">

      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#7C8FFF 1px, transparent 1px), linear-gradient(90deg, #7C8FFF 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7C8FFF]/6 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-80 h-80 bg-[#36DDAB]/5 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-80 h-80 bg-[#B48EFF]/5 rounded-full blur-[100px]" />

      {/* Floating dots */}
      {FLOAT_DOTS.map((dot, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{ left: dot.x, top: dot.y, width: dot.size, height: dot.size, backgroundColor: dot.color }}
          animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3 + i * 0.4, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-10 flex flex-col items-center text-center max-w-2xl mx-auto px-4"
      >
        {/* Orbital icon */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          {/* Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-[#7C8FFF]/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#7C8FFF] shadow-[0_0_8px_#7C8FFF]" />
          </motion.div>
          <motion.div
            className="absolute inset-3 rounded-full border border-[#B48EFF]/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B48EFF] shadow-[0_0_6px_#B48EFF]" />
          </motion.div>
          {/* Core */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B253B] to-[#121A2E] border border-white/10 flex items-center justify-center shadow-2xl">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FileBarChart className="w-8 h-8 text-[#7C8FFF]" style={{ filter: "drop-shadow(0 0 10px #7C8FFF80)" }} />
            </motion.div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB547]/10 border border-[#FFB547]/20 text-[10px] font-bold text-[#FFB547] uppercase tracking-widest">
            <Construction size={10} />
            Đang Phát Triển
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#36DDAB]/10 border border-[#36DDAB]/20 text-[10px] font-bold text-[#36DDAB] uppercase tracking-widest">
            <Zap size={10} />
            AI-Powered
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black font-display text-[#ECF0F7] tracking-tight mb-4">
          Recruitment{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF]">Reports</span>
        </h1>

        <p className="text-[#5A6882] text-base leading-relaxed mb-6 max-w-lg">
          Hệ thống báo cáo tuyển dụng đang được xây dựng — phân tích chuyên sâu, theo dõi hiệu suất và xuất dữ liệu sắp ra mắt.
        </p>

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B253B] border border-white/5 text-xs text-[#8B99B0]">
          <Target size={12} className="text-[#7C8FFF]" />
          Dự kiến ra mắt: <span className="text-[#ECF0F7] font-semibold ml-1">Q3 2026</span>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="group mt-5 flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF] text-white text-sm font-semibold shadow-lg shadow-[#7C8FFF]/20 hover:shadow-[#7C8FFF]/30 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
          )}
          {exporting ? "Đang tạo báo cáo…" : "Xuất báo cáo Excel"}
        </button>
      </motion.div>

      {/* ── Features Grid ── */}
      <div className="relative z-10 mt-14 w-full max-w-4xl mx-auto px-4">
        <p className="text-[10px] font-bold text-[#5A6882] uppercase tracking-[0.2em] text-center mb-6">
          Tính năng dự kiến
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLANNED_FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group relative bg-[#1B253B] border border-[#8B99B0]/10 rounded-2xl p-5 overflow-hidden hover:border-white/10 transition-colors"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${feat.color}20` }} />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${feat.color}15` }}>
                    <Icon size={16} style={{ color: feat.color }} />
                  </div>
                  <p className="text-[13px] font-semibold text-[#8B99B0] group-hover:text-[#ECF0F7] transition-colors leading-snug">
                    {feat.label}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#5A6882] uppercase tracking-wider">Tiến độ</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: feat.color }}>{feat.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#121A2E] rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: feat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${feat.progress}%` }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-12"
      >
        <Link href="/dashboard/recruitment">
          <button className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#1B253B] border border-[#8B99B0]/15 text-[#8B99B0] hover:text-[#ECF0F7] hover:border-[#7C8FFF]/30 transition-all text-sm font-semibold">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại Recruitment
          </button>
        </Link>
      </motion.div>
    </div>
  );
}

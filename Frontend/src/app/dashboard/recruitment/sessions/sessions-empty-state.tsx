"use client";

import { CalendarDays, Plus, SlidersHorizontal } from "lucide-react";

interface Props {
    hasFilters: boolean;
    canManage: boolean;
    onReset: () => void;
    onCreate: () => void;
}

export default function SessionsEmptyState({ hasFilters, canManage, onReset, onCreate }: Props) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 select-none">

            {/* Layered ring decoration */}
            <div className="relative flex items-center justify-center mb-10">
                {/* Pulsing rings — staggered via animationDelay */}
                {[0, 0.7, 1.4].map((delay, i) => (
                    <span
                        key={i}
                        className="absolute rounded-full animate-ping"
                        style={{
                            width:  `${96 + i * 40}px`,
                            height: `${96 + i * 40}px`,
                            background: `rgba(124,143,255,${0.07 - i * 0.02})`,
                            animationDuration: "2.4s",
                            animationDelay: `${delay}s`,
                        }}
                    />
                ))}

                {/* Static glow halo */}
                <div className="absolute w-40 h-40 rounded-full pointer-events-none"
                     style={{ background: "radial-gradient(circle, rgba(124,143,255,0.14) 0%, transparent 70%)" }} />

                {/* Static rings */}
                <div className="absolute w-36 h-36 rounded-full" style={{ border: "1px solid rgba(124,143,255,0.12)" }} />
                <div className="absolute w-28 h-28 rounded-full" style={{ border: "1px solid rgba(124,143,255,0.16)" }} />

                {/* Icon container */}
                <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center z-10"
                     style={{
                         background: "linear-gradient(135deg, #0D1525 0%, #111D30 100%)",
                         border: "1px solid rgba(124,143,255,0.25)",
                         boxShadow: "0 0 48px rgba(124,143,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                     }}>
                    {hasFilters
                        ? <SlidersHorizontal className="w-10 h-10" style={{ color: "#7C8FFF", opacity: 0.75 }} />
                        : <CalendarDays    className="w-10 h-10" style={{ color: "#7C8FFF", opacity: 0.75 }} />
                    }
                </div>
            </div>

            {/* Headline */}
            <h3
                className="text-xl font-bold font-display mb-3 text-center"
                style={{
                    background: "linear-gradient(135deg, #ECF0F7 30%, #8B99B0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {hasFilters ? "Không có kết quả phù hợp" : "Chưa có buổi phỏng vấn nào"}
            </h3>

            <p className="text-sm text-[#5A6882] text-center max-w-xs leading-relaxed mb-8">
                {hasFilters
                    ? "Thử thay đổi hoặc xoá bộ lọc để xem các buổi phỏng vấn khác."
                    : "Tạo buổi phỏng vấn đầu tiên để bắt đầu quy trình phỏng vấn theo vòng, xếp ứng viên và theo dõi xác nhận."}
            </p>

            {hasFilters ? (
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#8B99B0] hover:text-[#ECF0F7] transition-all duration-200 cursor-pointer"
                    style={{ border: "1px solid rgba(139,153,176,0.2)" }}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Xoá bộ lọc
                </button>
            ) : canManage ? (
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-[0.98]"
                    style={{
                        background: "linear-gradient(135deg, #7C8FFF 0%, #5B6CF0 100%)",
                        boxShadow: "0 0 36px rgba(124,143,255,0.40), 0 4px 20px rgba(0,0,0,0.4)",
                    }}
                >
                    <Plus className="w-4 h-4" /> Tạo buổi phỏng vấn
                </button>
            ) : null}
        </div>
    );
}

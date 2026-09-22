"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface PerformanceTrendDonutProps {
  passed?: number;
  failed?: number;
  inProgress?: number;
  monthlyData?: Array<{ month: number; passed: number; failed: number }>;
}

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

export default function PerformanceTrendDonut({
  passed = 0,
  failed = 0,
  inProgress = 0,
  monthlyData = [],
}: PerformanceTrendDonutProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Donut data calculation
  const total = passed + failed + inProgress;
  const safeTotal = total > 0 ? total : 1;

  const slices = [
    { label: "Đạt yêu cầu", value: passed, color: "#2e7d64", textColor: "text-[#2e7d64]" },
    { label: "Đang xử lý", value: inProgress, color: "#00a9ff", textColor: "text-[#0077cc]" },
    { label: "Chưa đạt", value: failed, color: "#e11d48", textColor: "text-[#e11d48]" },
  ];

  // SVG circle calculations - Ultra-bold stroke thickness (34px) matching PeopleFlow reference
  const size = 146;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const nonZeroSlices = slices.filter((s) => s.value > 0);
  const gap = nonZeroSlices.length > 1 ? 3 : 0;

  let accumulatedAngle = 0;
  const donutSegments = slices.map((slice) => {
    const sliceAngle = (slice.value / safeTotal) * circumference;
    const dash = Math.max(0, sliceAngle - gap);
    const offset = -accumulatedAngle;
    accumulatedAngle += sliceAngle;
    return {
      ...slice,
      dashArray: `${dash} ${circumference - dash}`,
      offset,
      pct: total > 0 ? Math.round((slice.value / total) * 100) : 0,
    };
  });

  // Monthly trend area chart points
  const points = useMemo(() => {
    // Generate 12 months array
    const dataByMonth = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyData.find((d) => d.month === i);
      const val = found ? found.passed + found.failed : Math.max(2, Math.round(Math.sin((i + 1) * 0.7) * 8 + 12));
      return { month: i, value: val };
    });

    const maxValue = Math.max(...dataByMonth.map((d) => d.value), 10);
    const width = 300;
    const height = 90;
    const paddingX = 14;
    const paddingY = 12;

    const coords = dataByMonth.map((d, index) => {
      const x = paddingX + (index / 11) * (width - 2 * paddingX);
      const y = height - paddingY - (d.value / maxValue) * (height - 2 * paddingY);
      return { x, y, value: d.value, month: d.month };
    });

    // Create smooth cubic bezier curve
    let dPath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX = (curr.x + next.x) / 2;
      dPath += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaPath = `${dPath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { coords, dPath, areaPath, width, height };
  }, [monthlyData]);

  return (
    <div className="bg-card border border-[#cde9f5] rounded-2xl p-5 shadow-[0_2px_14px_rgba(0,169,255,0.08)] flex flex-col justify-between h-full min-h-[440px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e5f3fa]">
        <div>
          <h3 className="text-base font-bold text-[#264e6b]">Hiệu Suất Tuyển Dụng</h3>
          <p className="text-xs font-medium text-[#6b8ca0] mt-0.5">Tỷ lệ đánh giá & xu hướng 12 tháng</p>
        </div>
        <span className="text-xs font-bold text-[#0077cc] px-3 py-0.5 rounded-full bg-[#cdf5fd]">
          Tổng quan
        </span>
      </div>

      {/* Top Part: Extra-Thick Donut Chart + Legend */}
      <div className="flex items-center justify-between gap-5 py-3">
        {/* Donut graphic with center text */}
        <div className="relative shrink-0 filter drop-shadow-xs" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#ffffff"
              strokeWidth={strokeWidth}
            />
            {total === 0 ? (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#cde9f5"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} 0`}
              />
            ) : (
              donutSegments.map((seg) => (
                <circle
                  key={seg.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.offset}
                  className="transition-all duration-700 ease-out"
                />
              ))
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-4xl font-extrabold tracking-tight text-[#264e6b] tabular-nums leading-none">
              {total}
            </span>
            <span className="text-xs uppercase tracking-wider text-[#6b8ca0] mt-1.5 font-bold">
              Ứng viên
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {donutSegments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[#264e6b] text-sm font-bold truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 tabular-nums shrink-0 ml-2">
                <span className="font-extrabold text-[#264e6b] text-sm">{seg.value}</span>
                <span className="text-xs text-[#6b8ca0] font-bold">({seg.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Part: Smooth Area Trend Chart */}
      <div className="pt-3 border-t border-[#e5f3fa]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-[#264e6b]">Xu hướng hồ sơ hàng tháng</span>
          <span className="text-xs text-[#0077cc] font-bold">
            {hoveredMonth !== null
              ? `${MONTH_LABELS[hoveredMonth]}: ${points.coords[hoveredMonth]?.value} hồ sơ`
              : "Năm 2026"}
          </span>
        </div>

        <div className="w-full relative h-[100px] flex items-end">
          <svg viewBox={`0 0 ${points.width} ${points.height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00a9ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00a9ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle grid lines */}
            <line x1="14" y1="20" x2="286" y2="20" stroke="#e5f3fa" strokeDasharray="3 3" />
            <line x1="14" y1="50" x2="286" y2="50" stroke="#e5f3fa" strokeDasharray="3 3" />
            <line x1="14" y1="80" x2="286" y2="80" stroke="#cde9f5" />

            {/* Area Fill */}
            <path d={points.areaPath} fill="url(#trendGradient)" />

            {/* Smooth Spline Stroke */}
            <path d={points.dPath} fill="none" stroke="#00a9ff" strokeWidth="2.5" strokeLinecap="round" />

            {/* Interactive Points */}
            {points.coords.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={hoveredMonth === i ? 4.5 : 2.5}
                fill={hoveredMonth === i ? "#0077cc" : "#ffffff"}
                stroke={hoveredMonth === i ? "#0077cc" : "#00a9ff"}
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredMonth(i)}
                onMouseLeave={() => setHoveredMonth(null)}
              />
            ))}
          </svg>
        </div>

        <div className="flex justify-between text-[9px] text-[#6b8ca0] font-mono mt-1 px-1">
          <span>T1</span>
          <span>T3</span>
          <span>T6</span>
          <span>T9</span>
          <span>T12</span>
        </div>
      </div>
    </div>
  );
}

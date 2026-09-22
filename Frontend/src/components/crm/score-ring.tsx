"use client";

interface ScoreRingProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  hidePercentage?: boolean;
  fontSizeRatio?: number;
}

export default function ScoreRing({ value, max = 100, size = 80, label, hidePercentage, fontSizeRatio = 0.18 }: ScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dashOffset = circumference * (1 - pct);
  const center = size / 2;
  const displayPct = Math.round(pct * 100);

  const strokeColor =
    displayPct >= 75 ? "var(--success)" : displayPct >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id={`grad-${displayPct}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.8} />
            <stop offset="100%" stopColor={strokeColor} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--background)"
          strokeWidth={size / 10}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={size / 10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: "url(#glow)"
          }}
          stroke={`url(#grad-${displayPct})`}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--foreground)"
          fontSize={size * fontSizeRatio}
          fontWeight="900"
          className="font-display"
          style={{
            transform: "rotate(90deg)",
            transformOrigin: `${center}px ${center}px`,
          }}
        >
          {displayPct}{hidePercentage ? "" : "%"}
        </text>
      </svg>
      {label && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{label}</span>}
    </div>
  );
}

"use client";

import { Layers } from "lucide-react";
import LevelRatio from "./level-ratio";

interface Ratios {
  junior: number;
  middle: number;
  senior: number;
}

const LEVEL_OPTIONS = [
  { value: "junior", label: "Junior", color: "text-blue-400 bg-blue-500/15" },
  { value: "middle", label: "Middle", color: "text-amber-400 bg-amber-500/15" },
  { value: "senior", label: "Senior", color: "text-purple-400 bg-purple-500/15" },
];

interface Props {
  mode: "single" | "mixed";
  setMode: (m: "single" | "mixed") => void;
  total: number;
  setTotal: (n: number) => void;
  lockTotal: boolean;
  hideTotal: boolean;
  level: string;
  setLevel: (l: string) => void;
  ratios: Ratios;
  setRatios: (ratios: Ratios) => void;
}

// Level/total/ratio selectors of the level-config step. Split out of level-config-step.tsx.
export default function LevelConfigSelectors({
  mode,
  setMode,
  total,
  setTotal,
  lockTotal,
  hideTotal,
  level,
  setLevel,
  ratios,
  setRatios,
}: Props) {
  return (
    <>
      {/* Mode toggle */}
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Level mode</p>
        <div className="flex gap-2">
          {(["single", "mixed"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                mode === m
                  ? "bg-success/15 border-border/40 text-success"
                  : "border-border/15 text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {m === "single" ? "Single level" : "Mixed levels"}
            </button>
          ))}
        </div>
      </div>

      {!hideTotal && (
      <div>
        <label className="block text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
          Total questions
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={total}
          disabled={lockTotal}
          onChange={(e) => setTotal(parseInt(e.target.value, 10) || 1)}
          className="w-32 h-9 px-3 text-sm rounded-lg bg-muted/80 border border-border/20 text-foreground focus:outline-none focus:border-border/40 disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </div>
      )}

      {/* Single level selector */}
      {mode === "single" && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Level</p>
          <div className="flex gap-2">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLevel(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  level === opt.value
                    ? `${opt.color} border-current/30`
                    : "border-border/15 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mixed ratios */}
      {mode === "mixed" && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">
            Level ratio
          </p>
          <LevelRatio value={ratios} onChange={setRatios} />
        </div>
      )}
    </>
  );
}

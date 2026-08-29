"use client";

import { cn } from "@/lib/utils";

interface Ratios {
  junior: number;
  middle: number;
  senior: number;
}

interface LevelRatioProps {
  value: Ratios;
  onChange: (value: Ratios) => void;
  className?: string;
}

export default function LevelRatio({
  value,
  onChange,
  className,
}: LevelRatioProps) {
  const firstHandle = value.junior;
  const secondHandle = value.junior + value.middle;

  const setMixedHandle = (handle: "first" | "second", inputValue: number) => {
    const clamped = Math.max(0, Math.min(100, inputValue));
    if (handle === "first") {
      const nextFirst = Math.min(clamped, secondHandle);
      onChange({
        junior: nextFirst,
        middle: secondHandle - nextFirst,
        senior: 100 - secondHandle,
      });
      return;
    }
    const nextSecond = Math.max(clamped, firstHandle);
    onChange({
      junior: firstHandle,
      middle: nextSecond - firstHandle,
      senior: 100 - nextSecond,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-4 rounded-xl border border-[#8B99B0]/10 bg-[#1E2840]/35 px-4 py-4">
        <div className="relative h-9">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[#0C1220] border border-[#8B99B0]/10">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500/70"
              style={{ width: `${value.junior}%` }}
            />
            <div
              className="absolute top-0 h-full bg-amber-500/70"
              style={{ left: `${value.junior}%`, width: `${value.middle}%` }}
            />
            <div
              className="absolute top-0 h-full bg-purple-500/70"
              style={{
                left: `${value.junior + value.middle}%`,
                width: `${value.senior}%`,
              }}
            />
          </div>
          <input
            aria-label="Junior ratio handle"
            type="range"
            min={0}
            max={100}
            value={firstHandle}
            onChange={(event) =>
              setMixedHandle("first", parseInt(event.target.value, 10))
            }
            className="ratio-range absolute inset-x-0 top-0 h-9 w-full cursor-pointer appearance-none bg-transparent pointer-events-none [--thumb-color:#60A5FA]"
          />
          <input
            aria-label="Senior ratio handle"
            type="range"
            min={0}
            max={100}
            value={secondHandle}
            onChange={(event) =>
              setMixedHandle("second", parseInt(event.target.value, 10))
            }
            className="ratio-range absolute inset-x-0 top-0 h-9 w-full cursor-pointer appearance-none bg-transparent pointer-events-none [--thumb-color:#C084FC]"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-blue-500/10 px-2 py-2 text-blue-400 text-center font-medium">
            Junior {value.junior}%
          </div>
          <div className="rounded-lg bg-amber-500/10 px-2 py-2 text-amber-400 text-center font-medium">
            Middle {value.middle}%
          </div>
          <div className="rounded-lg bg-purple-500/10 px-2 py-2 text-purple-400 text-center font-medium">
            Senior {value.senior}%
          </div>
        </div>
      </div>

      <style jsx>{`
        .ratio-range::-webkit-slider-runnable-track {
          height: 0;
          background: transparent;
        }
        .ratio-range::-webkit-slider-thumb {
          appearance: none;
          pointer-events: auto;
          width: 18px;
          height: 18px;
          margin-top: -9px;
          border-radius: 9999px;
          background: var(--thumb-color);
          border: 3px solid #0f1626;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18),
            0 8px 20px rgba(0, 0, 0, 0.35);
        }
        .ratio-range::-moz-range-track {
          height: 0;
          background: transparent;
        }
        .ratio-range::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: var(--thumb-color);
          border: 3px solid #0f1626;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18),
            0 8px 20px rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Settings, Filter, CheckCircle2, Loader2 } from "lucide-react";

export default function RecruitmentSettingsClient({ canEdit = false }: { canEdit?: boolean }) {
  const [threshold, setThreshold] = useState<number>(40);
  const [input, setInput] = useState("40");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/recruitment/settings")
      .then((r) => r.json())
      .then((d) => {
        const t = d.autoRejectThreshold ?? 40;
        setThreshold(t);
        setInput(String(t));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(input);
    if (!Number.isInteger(val) || val < 0 || val > 100) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/recruitment/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRejectThreshold: val }),
      });
      if (!res.ok) throw new Error();
      setThreshold(val);
      setSaveState("saved");
      setTimeout(() => { setSaveState("idle"); }, 4000);
    } catch {
      setSaveState("idle");
    }
  }

  return (
    <div className="py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-ai/10 border border-border/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Recruitment Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure pipeline automation and filtering behaviour</p>
          </div>
        </div>

        <div className="h-8 flex items-center gap-3">
          {!canEdit && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted border border-border/15 px-2.5 py-1 rounded-lg">
              Chỉ xem
            </span>
          )}
          {saveState === "saving" && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-border/20 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
              {saveState === "saved" && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-border/20">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Category card */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-border/30 border-t-border rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden shadow-xl shadow-black/20">
          {/* Gradient accent header */}
          <div className="bg-gradient-to-r from-warning/20 to-danger/5 px-5 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "color-mix(in srgb, var(--warning) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--warning) 19%, transparent)" }}>
                <Filter className="w-4 h-4 text-warning" />
              </div>
              <div>
                <h2 className="text-sm font-bold capitalize tracking-wide text-warning">Review Guidance</h2>
                <p className="text-[11px] text-muted-foreground">1 setting</p>
              </div>
            </div>
          </div>

          {/* Setting row */}
          <form onSubmit={handleSave}>
            <div className="flex items-center justify-between gap-8 px-5 py-5 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.015] transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Review Threshold</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Ứng viên có AI score thấp hơn ngưỡng này được đánh dấu để người phụ trách xem xét.
                  Hệ thống không tự chuyển sang REJECTED. Per-JD threshold (nếu có) sẽ ghi đè giá trị này.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-border/20">
                    Gợi ý review nếu score &lt; {threshold}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0 w-56">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!canEdit}
                  className="w-full accent-warning disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!canEdit}
                    className="w-20 px-3 py-1.5 rounded-lg bg-background border border-border/20 text-foreground text-sm text-right tabular-nums focus:outline-none focus:border-border/50 disabled:opacity-40"
                  />
                  <span className="text-sm text-muted-foreground select-none">/ 100</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="px-5 py-3 flex justify-end border-t border-white/[0.04] bg-white/[0.01]">
                <button
                  type="submit"
                  disabled={saveState === "saving"}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-warning text-background hover:bg-warning transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-warning/20"
                >
                  {saveState === "saving" ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

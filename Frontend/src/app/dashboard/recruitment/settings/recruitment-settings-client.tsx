"use client";

import { useState, useEffect } from "react";
import { Settings, Filter, CheckCircle2, Loader2 } from "lucide-react";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import FormSection from "@/components/shares/form-section";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecruitmentSettingsClient({ canEdit = false }: { canEdit?: boolean }) {
  const [threshold, setThreshold] = useState<number>(40);
  const [input, setInput] = useState("40");
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

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
    if (!Number.isInteger(val) || val < 0 || val > 100) {
      setError("Ngưỡng phải là số nguyên từ 0 đến 100.");
      return;
    }
    setError(null);
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
      setError("Không lưu được. Thử lại sau.");
    }
  }

  return (
    <div className="py-6 pb-12">
      <SharedDashboardPageHeader
        title="Recruitment Settings"
        icon={Settings}
        badge={canEdit ? undefined : { label: "Chỉ xem", tone: "gold" }}
        description="Cấu hình tự động hoá pipeline và ngưỡng lọc hồ sơ"
        actions={(
          <div className="h-8 flex items-center" aria-live="polite">
            {saveState === "saving" && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu
              </span>
            )}
            {saveState === "saved" && (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-success/10 text-success">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu
              </span>
            )}
          </div>
        )}
      />

      <div className="max-w-4xl">
        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : (
          <FormSection icon={Filter} tone="orange" title="Review Guidance" subtitle="1 thiết lập" bodyClassName="p-0">
            <form onSubmit={handleSave}>
              <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1">
                  <label htmlFor="review-threshold" className="text-sm font-bold text-foreground">Review Threshold</label>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Ứng viên có AI score thấp hơn ngưỡng này được đánh dấu để người phụ trách xem xét.
                    Hệ thống không tự chuyển sang REJECTED. Per-JD threshold (nếu có) sẽ ghi đè giá trị này.
                  </p>
                  <span className="mt-3 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-warning/10 text-warning">
                    Gợi ý review nếu score &lt; {threshold}%
                  </span>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-56 sm:items-end">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={input}
                    aria-label="Review threshold"
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!canEdit}
                    className="w-full accent-primary disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="review-threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={input}
                      aria-invalid={!!error}
                      aria-describedby={error ? "review-threshold-error" : undefined}
                      onChange={(e) => { setInput(e.target.value); setError(null); }}
                      disabled={!canEdit}
                      className="w-20 px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm text-right tabular-nums focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 aria-[invalid=true]:border-danger disabled:opacity-40"
                    />
                    <span className="text-sm text-muted-foreground select-none">/ 100</span>
                  </div>
                  {error && <p id="review-threshold-error" className="text-xs font-semibold text-danger">{error}</p>}
                </div>
              </div>

              {canEdit && (
                <div className="px-5 py-3 flex justify-end border-t border-border bg-muted/30">
                  <SharedDashboardButton type="submit" variant="primary" disabled={saveState === "saving"}>
                    {saveState === "saving" ? "Đang lưu..." : "Lưu cài đặt"}
                  </SharedDashboardButton>
                </div>
              )}
            </form>
          </FormSection>
        )}
      </div>
    </div>
  );
}

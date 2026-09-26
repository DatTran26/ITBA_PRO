"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface OverrideScoreDialogProps {
  applicationId: string;
  currentFinalScore: number | null;
  onSuccess: (finalScore: number) => void;
  customTrigger?: React.ReactNode;
}

export default function OverrideScoreDialog({
  applicationId,
  currentFinalScore,
  onSuccess,
  customTrigger,
}: OverrideScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<string>(
    currentFinalScore !== null ? String(currentFinalScore) : ""
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleOpen() {
    setScore(currentFinalScore !== null ? String(currentFinalScore) : "");
    setReason("");
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedScore = Number(score);
    if (!score || isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setError("Điểm phải là số từ 0 đến 100.");
      return;
    }
    if (reason.trim().length < 10) {
      setError("Lý do phải có ít nhất 10 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/recruitment/applications/${applicationId}/override-score`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ finalScore: parsedScore, overrideReason: reason }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      setOpen(false);
      onSuccess(parsedScore);
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  const modal = open ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-muted border border-muted-foreground/15 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Chỉnh điểm ứng viên</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-muted-foreground transition-colors text-lg leading-none cursor-pointer"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="override-score">
              Điểm mới <span className="text-danger">*</span>
            </label>
            <input
              id="override-score"
              type="number"
              min={0}
              max={100}
              step={1}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0 – 100"
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg bg-card border border-muted-foreground/20 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-background/50 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="override-reason">
              Lý do chỉnh điểm <span className="text-danger">*</span>
            </label>
            <textarea
              id="override-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do (tối thiểu 10 ký tự)..."
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg bg-card border border-muted-foreground/20 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-background/50 resize-none disabled:opacity-50"
            />
            <span className="text-xs text-muted-foreground text-right">
              {reason.trim().length}/10 ký tự tối thiểu
            </span>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      {customTrigger ? (
        <div onClick={handleOpen} className="inline-block">
          {customTrigger}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors cursor-pointer"
        >
          Chỉnh điểm
        </button>
      )}

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

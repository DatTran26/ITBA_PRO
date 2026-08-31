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
      <div className="relative bg-[#151D2E] border border-[#8B99B0]/15 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#ECF0F7]">Chỉnh điểm ứng viên</h2>
          <button
            onClick={handleClose}
            className="text-[#5A6882] hover:text-[#8B99B0] transition-colors text-lg leading-none cursor-pointer"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#8B99B0]" htmlFor="override-score">
              Điểm mới <span className="text-[#EF4444]">*</span>
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
              className="w-full px-3 py-2 rounded-lg bg-[#0F1628] border border-[#8B99B0]/20 text-[#ECF0F7] text-sm placeholder-[#5A6882] focus:outline-none focus:border-[#7C8FFF]/50 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#8B99B0]" htmlFor="override-reason">
              Lý do chỉnh điểm <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              id="override-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do (tối thiểu 10 ký tự)..."
              disabled={loading}
              className="w-full px-3 py-2 rounded-lg bg-[#0F1628] border border-[#8B99B0]/20 text-[#ECF0F7] text-sm placeholder-[#5A6882] focus:outline-none focus:border-[#7C8FFF]/50 resize-none disabled:opacity-50"
            />
            <span className="text-xs text-[#5A6882] text-right">
              {reason.trim().length}/10 ký tự tối thiểu
            </span>
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm text-[#8B99B0] hover:text-[#ECF0F7] border border-[#8B99B0]/20 hover:border-[#8B99B0]/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#7C8FFF] text-white hover:bg-[#7C8FFF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#7C8FFF]/15 border border-[#7C8FFF]/30 text-[#7C8FFF] hover:bg-[#7C8FFF]/25 transition-colors cursor-pointer"
        >
          Chỉnh điểm
        </button>
      )}

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

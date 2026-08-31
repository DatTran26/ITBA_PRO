"use client";

import { useState } from "react";

interface OnboardDialogProps {
  applicationId: string;
  onSuccess: () => void;
}

export default function OnboardDialog({ applicationId, onSuccess }: OnboardDialogProps) {
  const [open, setOpen] = useState(false);
  const [joinedDate, setJoinedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setJoinedDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!joinedDate) {
      setError("Vui lòng chọn ngày gia nhập.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/applications/${applicationId}/offer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "onboard", joined_date: joinedDate, note: note || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      setOpen(false);
      onSuccess();
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
      >
        Onboard
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative glass-card w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#ECF0F7]">Xác nhận Onboard</h2>
              <button
                onClick={handleClose}
                className="text-[#5A6882] hover:text-[#8B99B0] transition-colors text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-[#8B99B0]">
              Hành động này sẽ chuyển ứng viên thành <span className="text-[#ECF0F7] font-medium">nhân viên chính thức</span> và cập nhật hồ sơ trong hệ thống.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[#8B99B0]" htmlFor="joined-date">
                  Ngày gia nhập <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="joined-date"
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F1628] border border-[#8B99B0]/20 text-[#ECF0F7] text-sm focus:outline-none focus:border-[#7C8FFF]/50 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[#8B99B0]" htmlFor="onboard-note">
                  Ghi chú
                </label>
                <textarea
                  id="onboard-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-[#0F1628] border border-[#8B99B0]/20 text-[#ECF0F7] text-sm placeholder-[#5A6882] focus:outline-none focus:border-[#7C8FFF]/50 resize-none disabled:opacity-50"
                />
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
                  className="px-4 py-2 rounded-lg text-sm text-[#8B99B0] hover:text-[#ECF0F7] border border-[#8B99B0]/20 hover:border-[#8B99B0]/40 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#10B981] text-white hover:bg-[#10B981]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận Onboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

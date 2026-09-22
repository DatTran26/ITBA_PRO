"use client";

import { useState } from "react";

interface InterviewResultDialogProps {
  scheduleId: string;
  onSuccess: (result: "pass" | "fail") => void;
}

export default function InterviewResultDialog({
  scheduleId,
  onSuccess,
}: InterviewResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"pass" | "fail">("pass");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setResult("pass");
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
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/interviews/${scheduleId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, note: note || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
        return;
      }

      setOpen(false);
      onSuccess(result);
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
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-success/15 border border-success/30 text-success hover:bg-success/25 transition-colors"
      >
        Nhập kết quả
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative glass-card w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Kết quả phỏng vấn</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-muted-foreground transition-colors text-lg leading-none"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">
                  Kết quả <span className="text-danger">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResult("pass")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      result === "pass"
                        ? "bg-success/20 border-success/50 text-success"
                        : "bg-transparent border-muted-foreground/20 text-muted-foreground hover:border-success/30 hover:text-success"
                    }`}
                  >
                    Đạt (Pass)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResult("fail")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      result === "fail"
                        ? "bg-danger/20 border-danger/50 text-danger"
                        : "bg-transparent border-muted-foreground/20 text-muted-foreground hover:border-danger/30 hover:text-danger"
                    }`}
                  >
                    Không đạt (Fail)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="result-note">
                  Nhận xét
                </label>
                <textarea
                  id="result-note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhận xét về ứng viên sau phỏng vấn..."
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-muted-foreground/20 text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-background/50 resize-none disabled:opacity-50"
                />
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
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground border border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

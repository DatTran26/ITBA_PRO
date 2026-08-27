"use client";

import { useState, useEffect } from "react";

interface Skill { skill: string; weight?: number }

interface JdFormValues {
  title: string;
  role_key: string;
  department: string;
  seniority: string;
  required_skills: Skill[];
  full_text: string;
  auto_reject_threshold: string;
  is_active: boolean;
}

interface JdData {
  id: string;
  title?: string | null;
  role_key?: string | null;
  department?: string | null;
  seniority?: string | null;
  required_skills?: { skill: string; weight?: number }[];
  full_text?: string | null;
  auto_reject_threshold?: number | null;
  is_active?: boolean | null;
}

interface JdFormDialogProps {
  mode: "create" | "edit";
  jd?: JdData;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

const EMPTY: JdFormValues = {
  title: "", role_key: "", department: "", seniority: "",
  required_skills: [], full_text: "", auto_reject_threshold: "", is_active: true,
};

export default function JdFormDialog({ mode, jd, trigger, onSuccess }: JdFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<JdFormValues>(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && jd) {
      setForm({
        title: jd.title ?? "",
        role_key: jd.role_key ?? "",
        department: jd.department ?? "",
        seniority: jd.seniority ?? "",
        required_skills: jd.required_skills ?? [],
        full_text: jd.full_text ?? "",
        auto_reject_threshold: jd.auto_reject_threshold != null ? String(jd.auto_reject_threshold) : "",
        is_active: jd.is_active ?? true,
      });
    } else {
      setForm(EMPTY);
    }
    setSkillInput("");
    setError(null);
  }, [open, mode, jd]);

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (form.required_skills.some((r) => r.skill === s)) { setSkillInput(""); return; }
    setForm((f) => ({ ...f, required_skills: [...f.required_skills, { skill: s }] }));
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, required_skills: f.required_skills.filter((r) => r.skill !== skill) }));
  }

  function handleClose() { if (loading) return; setOpen(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError("Tiêu đề JD là bắt buộc."); return; }

    const threshold = form.auto_reject_threshold === "" ? null : Number(form.auto_reject_threshold);
    if (threshold !== null && (isNaN(threshold) || threshold < 0 || threshold > 100)) {
      setError("Ngưỡng auto-reject phải từ 0 đến 100."); return;
    }

    setLoading(true);
    try {
      const url = mode === "create"
        ? "/api/recruitment/job-descriptions"
        : `/api/recruitment/job-descriptions/${jd!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, auto_reject_threshold: threshold }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Đã xảy ra lỗi."); return; }
      setOpen(false);
      onSuccess();
    } catch { setError("Không thể kết nối đến máy chủ."); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg bg-[#0F1628] border border-[#8B99B0]/20 text-[#ECF0F7] text-sm placeholder-[#5A6882] focus:outline-none focus:border-[#7C8FFF]/50 disabled:opacity-50";
  const labelCls = "text-sm text-[#8B99B0]";

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative glass-card w-full max-w-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#ECF0F7]">
                {mode === "create" ? "Tạo Job Description" : "Chỉnh sửa Job Description"}
              </h2>
              <button onClick={handleClose} className="text-[#5A6882] hover:text-[#8B99B0] text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Tiêu đề <span className="text-[#EF4444]">*</span></label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} disabled={loading} placeholder="VD: Senior Backend Engineer" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Role key</label>
                  <input value={form.role_key} onChange={(e) => setForm((f) => ({ ...f, role_key: e.target.value }))} disabled={loading} placeholder="VD: backend_engineer" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Phòng ban</label>
                  <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} disabled={loading} placeholder="VD: Engineering" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Seniority</label>
                  <input value={form.seniority} onChange={(e) => setForm((f) => ({ ...f, seniority: e.target.value }))} disabled={loading} placeholder="VD: Senior, Mid, Junior" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Kỹ năng yêu cầu</label>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    disabled={loading}
                    placeholder="Nhập kỹ năng rồi Enter..."
                    className={inputCls}
                  />
                  <button type="button" onClick={addSkill} disabled={loading} className="px-3 py-2 rounded-lg bg-[#7C8FFF]/15 text-[#7C8FFF] text-sm border border-[#7C8FFF]/30 hover:bg-[#7C8FFF]/25 transition-colors shrink-0">
                    Thêm
                  </button>
                </div>
                {form.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.required_skills.map((s) => (
                      <span key={s.skill} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7C8FFF]/10 border border-[#7C8FFF]/20 text-xs text-[#7C8FFF]">
                        {s.skill}
                        <button type="button" onClick={() => removeSkill(s.skill)} className="text-[#7C8FFF]/60 hover:text-[#7C8FFF] leading-none">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Mô tả đầy đủ (full_text)</label>
                <textarea rows={5} value={form.full_text} onChange={(e) => setForm((f) => ({ ...f, full_text: e.target.value }))} disabled={loading} placeholder="Nội dung JD đầy đủ..." className={`${inputCls} resize-none`} />
                <span className="text-xs text-[#5A6882] text-right">{form.full_text.length}/20480</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Ngưỡng auto-reject (0–100, để trống = dùng global)</label>
                  <input type="number" min={0} max={100} value={form.auto_reject_threshold} onChange={(e) => setForm((f) => ({ ...f, auto_reject_threshold: e.target.value }))} disabled={loading} placeholder="VD: 40" className={inputCls} />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input id="jd-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} disabled={loading} className="w-4 h-4 accent-[#7C8FFF]" />
                  <label htmlFor="jd-active" className={labelCls}>Active</label>
                </div>
              </div>

              {error && <p className="text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2 rounded-lg text-sm text-[#8B99B0] hover:text-[#ECF0F7] border border-[#8B99B0]/20 hover:border-[#8B99B0]/40 transition-colors disabled:opacity-50">Hủy</button>
                <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#7C8FFF] text-white hover:bg-[#7C8FFF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Đang lưu..." : mode === "create" ? "Tạo JD" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

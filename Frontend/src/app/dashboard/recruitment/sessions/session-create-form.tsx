"use client";

import { useState, useEffect } from "react";
import { Video, Building2, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface JobDescription { id: string; title: string; }

interface Props {
  onCreated: (sessionId: string) => void;
}

const DURATIONS = [30, 45, 60, 90];
const LOCATION_TYPES = [
  { value: "online", label: "Online", icon: Video },
  { value: "office", label: "Văn phòng", icon: Building2 },
  { value: "phone",  label: "Điện thoại", icon: Phone },
] as const;

const ROUND_CONFIG = [
  { value: 1, label: "Round 1", sub: "Sơ tuyển", color: "#7C8FFF" },
  { value: 2, label: "Round 2", sub: "Chuyên môn", color: "#F59E0B" },
  { value: 3, label: "Final",   sub: "Vòng cuối", color: "#B48EFF" },
] as const;

const LOCATION_PLACEHOLDER: Record<string, string> = {
  online: "Link Google Meet / Zoom",
  office: "Phòng họp / Địa chỉ văn phòng",
  phone:  "Hướng dẫn gọi điện",
};

export default function SessionCreateForm({ onCreated }: Props) {
  const [round, setRound] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [locationType, setLocationType] = useState<"online" | "office" | "phone">("online");
  const [locationDetail, setLocationDetail] = useState("");
  const [jdId, setJdId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [jdList, setJdList] = useState<JobDescription[]>([]);

  useEffect(() => {
    fetch("/api/recruitment/jd?active=true&pageSize=50")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.jobDescriptions) setJdList(d.jobDescriptions); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) { toast.error("Vui lòng chọn ngày và giờ"); return; }

    const scheduledAt = new Date(`${date}T${time}`);
    if (isNaN(scheduledAt.getTime())) { toast.error("Thời gian không hợp lệ"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recruitment/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          location_type: locationType,
          location_detail: locationDetail.trim() || null,
          job_description_id: jdId || null,
          recruiter_note: note.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Tạo thất bại"); return; }
      toast.success("Tạo buổi phỏng vấn thành công");
      onCreated(json.session.id);
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Round selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-3">Vòng phỏng vấn</p>
        <div className="grid grid-cols-3 gap-3">
          {ROUND_CONFIG.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRound(r.value)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                round === r.value
                  ? "border-current bg-opacity-10"
                  : "border-[#8B99B0]/15 bg-[#0C1422] hover:border-[#8B99B0]/30"
              }`}
              style={round === r.value ? { borderColor: r.color, background: `${r.color}18`, color: r.color } : {}}
            >
              <p className="font-bold text-sm" style={round === r.value ? { color: r.color } : { color: "#ECF0F7" }}>{r.label}</p>
              <p className="text-xs mt-0.5 text-[#8B99B0]">{r.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-2">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-[#0C1422] border border-[#8B99B0]/15 rounded-lg text-[#ECF0F7] px-3 py-2 text-sm focus:outline-none focus:border-[#7C8FFF]/50 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-2">Giờ</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full bg-[#0C1422] border border-[#8B99B0]/15 rounded-lg text-[#ECF0F7] px-3 py-2 text-sm focus:outline-none focus:border-[#7C8FFF]/50 cursor-pointer"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-3">Thời lượng</p>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                duration === d
                  ? "bg-[#7C8FFF] text-white"
                  : "bg-[#0C1422] border border-[#8B99B0]/15 text-[#8B99B0] hover:border-[#8B99B0]/30 hover:text-[#ECF0F7]"
              }`}
            >
              {d} phút
            </button>
          ))}
        </div>
      </div>

      {/* Location type */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-3">Hình thức</p>
        <div className="flex gap-2 mb-3">
          {LOCATION_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocationType(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                locationType === value
                  ? "bg-[#7C8FFF] text-white"
                  : "bg-[#0C1422] border border-[#8B99B0]/15 text-[#8B99B0] hover:border-[#8B99B0]/30 hover:text-[#ECF0F7]"
              }`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={locationDetail}
          onChange={(e) => setLocationDetail(e.target.value)}
          placeholder={LOCATION_PLACEHOLDER[locationType]}
          className="w-full bg-[#0C1422] border border-[#8B99B0]/15 rounded-lg text-[#ECF0F7] px-3 py-2 text-sm focus:outline-none focus:border-[#7C8FFF]/50"
        />
      </div>

      {/* Position (optional) */}
      {jdList.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-2">Vị trí (tuỳ chọn)</label>
          <select
            value={jdId}
            onChange={(e) => setJdId(e.target.value)}
            className="w-full bg-[#0C1422] border border-[#8B99B0]/15 rounded-lg text-[#ECF0F7] px-3 py-2 text-sm focus:outline-none focus:border-[#7C8FFF]/50 cursor-pointer"
          >
            <option value="">-- Không chọn --</option>
            {jdList.map((jd) => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
          </select>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#5A6882] mb-2">Ghi chú (tuỳ chọn)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Lưu ý cho buổi phỏng vấn..."
          className="w-full bg-[#0C1422] border border-[#8B99B0]/15 rounded-lg text-[#ECF0F7] px-3 py-2 text-sm focus:outline-none focus:border-[#7C8FFF]/50 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#7C8FFF] hover:bg-[#6B7FEE] text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Đang tạo..." : "Tạo buổi phỏng vấn"}
      </button>
    </form>
  );
}

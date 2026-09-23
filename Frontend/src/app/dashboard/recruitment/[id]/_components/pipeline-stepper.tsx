import { Check, X } from "lucide-react";
import { flowAt } from "@/lib/ui/tones";

const STEPS = ["NEW", "SCREENED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED", "PASSED", "OFFERED", "ONBOARDED"];
const LABEL: Record<string, string> = {
  NEW: "Mới", SCREENED: "Sàng lọc", SHORTLISTED: "Tiềm năng", INTERVIEW_SCHEDULED: "Hẹn PV",
  INTERVIEWED: "Đã PV", PASSED: "Đạt PV", OFFERED: "Đề xuất", ONBOARDED: "Onboard",
};
/* Nhánh rẽ khỏi luồng chính: điểm dừng tương ứng trên thanh. */
const EXIT_AT: Record<string, { at: string; label: string }> = {
  REJECTED: { at: "SCREENED", label: "Bị loại" },
  FAILED: { at: "INTERVIEWED", label: "Trượt PV" },
  OFFER_REJECTED: { at: "OFFERED", label: "Từ chối offer" },
  ACCEPTED: { at: "OFFERED", label: "Nhận offer" },
};

/** Hồ sơ đang ở bước nào của quy trình — cùng dải màu với funnel trang tuyển dụng. */
export default function PipelineStepper({ status }: { status: string }) {
  const exit = EXIT_AT[status];
  const current = STEPS.indexOf(exit ? exit.at : status);
  const failed = exit && status !== "ACCEPTED";

  return (
    <ol className="flex items-center">
      {STEPS.map((st, i) => {
        const done = i < current || (i === current && status === "ACCEPTED");
        const here = i === current;
        const c = flowAt(i, STEPS.length);
        return (
          <li key={st} className="flex-1 flex items-center min-w-0">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <span className={`w-8 h-8 rounded-full grid place-items-center text-xs font-black transition-all ${here ? "ring-4 scale-110" : ""}`}
                    style={{
                      backgroundColor: here && failed ? "var(--danger)" : done || here ? c : "var(--muted)",
                      color: done || here ? "#fff" : "var(--muted-foreground)",
                      ["--tw-ring-color" as string]: `color-mix(in srgb, ${here && failed ? "var(--danger)" : c} 25%, transparent)`,
                    }}>
                {here && failed ? <X className="w-4 h-4" /> : done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`text-[11px] font-bold truncate ${here ? "text-foreground" : "text-muted-foreground"}`}>
                {here && exit ? exit.label : LABEL[st]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="flex-1 h-1 mx-1.5 -mt-5 rounded-full" style={{ backgroundColor: i < current ? c : "var(--muted)" }} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/ui/tones";

/** Ô icon nền nhạt theo tông — như icon KPI của dashboard HR. */
export function ToneIcon({ icon: Icon, tone, size = "md", className }: { icon: LucideIcon; tone: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = { sm: "w-7 h-7 rounded-lg", md: "w-9 h-9 rounded-xl", lg: "w-11 h-11 rounded-xl" }[size];
  const ico = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }[size];
  return (
    <span className={cn(box, "shrink-0 grid place-items-center", className)} style={{ color: tone.ink, backgroundColor: tone.bg }}>
      <Icon className={ico} />
    </span>
  );
}

/** Pill chữ đậm trên nền nhạt cùng tông (ink ≥ 5.5:1 trên bg). */
export function TonePill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", className)}
          style={{ color: tone.ink, backgroundColor: tone.bg }}>
      {children}
    </span>
  );
}

"use client";

import { CheckCircle2, Briefcase, LineChart, Cpu, Compass, Code2, PenTool, ClipboardList, Smartphone, FileText, Database, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toneByName } from "@/lib/ui/tones";

/** Chính = blue (primary), phụ = orange, AI tìm thêm = teal. */
const MAIN = toneByName("blue");
const SLIDE = toneByName("orange");
const EXTRA = toneByName("teal");

const JOB_ROLES = [
    { name: "Backend Developer", icon: Database },
    { name: "Frontend Developer", icon: Code2 },
    { name: "Full-Stack Developer", icon: Layers },
    { name: "Business Analyst", icon: LineChart },
    { name: "QA Engineer", icon: ClipboardList },
    { name: "DevOps Engineer", icon: Cpu },
    { name: "Data Analyst", icon: Compass },
    { name: "Mobile Developer", icon: Smartphone },
    { name: "UI/UX Designer", icon: PenTool },
    { name: "Project Manager", icon: Briefcase },
    { name: "Other", icon: FileText },
];

export const JOB_ROLE_NAMES = JOB_ROLES.map((r) => r.name);

interface Props {
    selectedRole: string;
    setSelectedRole: (v: string) => void;
    slideRoles: string[];
    customSlideRoles: string[];
    customRole: string;
    setCustomRole: (v: string) => void;
}

// Step 01 — role selection grid (presets + slide/custom indicators + "Other" input).
// Split out of create-test-workbench.tsx.
export default function CreateTestRoleGrid({ selectedRole, setSelectedRole, slideRoles, customSlideRoles, customRole, setCustomRole }: Props) {
    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {JOB_ROLES.map((role) => {
                    const isMainRole = selectedRole === role.name;
                    const isSlideRole = !isMainRole && slideRoles.includes(role.name);
                    const tone = isMainRole ? MAIN : isSlideRole ? SLIDE : null;
                    return (
                        <button
                            key={role.name}
                            type="button"
                            aria-pressed={isMainRole}
                            onClick={() => setSelectedRole(role.name)}
                            className={cn(
                                "relative flex items-center gap-2 rounded-xl border py-2 pl-3 pr-3.5 text-sm font-semibold transition",
                                tone ? "" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                            )}
                            style={tone ? { borderColor: tone.mark, backgroundColor: tone.bg, color: tone.ink } : undefined}
                        >
                            <role.icon className="h-4 w-4" />
                            {role.name === "Other" ? "Khác" : role.name}
                            {isMainRole && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                {[{ t: MAIN, l: "Vai trò chính" }, { t: SLIDE, l: "Vai trò phụ (AI gợi ý)" }, { t: EXTRA, l: "Vai trò AI tìm thêm" }].map(({ t, l }) => (
                    <span key={l} className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.mark }} /> {l}
                    </span>
                ))}
            </div>

            {customSlideRoles.length > 0 && (
                <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">Vai trò AI tìm thêm từ JD</div>
                    <div className="flex flex-wrap gap-2">
                        {customSlideRoles.map((cRole, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold"
                                style={{ backgroundColor: EXTRA.bg, color: EXTRA.ink }}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                {cRole}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {selectedRole === "Other" && (
                <Input
                    type="text"
                    placeholder="VD: Blockchain Engineer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="mt-4 h-11 rounded-xl"
                    autoFocus
                />
            )}
        </div>
    );
}

"use client";

import { CheckCircle2, Briefcase, LineChart, Cpu, Compass, Code2, PenTool, ClipboardList, Smartphone, FileText, Database, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";

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
            <FadeIn delay={0.2}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-mono text-primary shadow-lg">01</div>
                    <h2 className="text-xl font-medium font-display text-foreground">Designate Role</h2>
                </div>
            </FadeIn>

            <StaggerContainer className="flex flex-wrap gap-2">
                {JOB_ROLES.map((role) => {
                    const isMainRole = selectedRole === role.name;
                    const isSlideRole = slideRoles.includes(role.name);

                    let btnClass = "border-white/5 bg-muted/40 text-muted-foreground hover:border-border/30 hover:bg-muted/60 hover:text-white backdrop-blur-sm";
                    let iconClass = "text-muted-foreground group-hover:text-muted-foreground";
                    let indicator = null;

                    if (isMainRole) {
                        btnClass = "!border-red-500/50 !bg-red-500/10 !text-red-400 shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--danger)_20%,transparent)]";
                        iconClass = "!text-red-400";
                        indicator = (
                            <div className="absolute -right-1 -top-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_10px_color-mix(in_srgb,var(--danger)_50%,transparent)]">
                                <CheckCircle2 className="w-2.5 h-2.5 text-foreground" />
                            </div>
                        );
                    } else if (isSlideRole) {
                        btnClass = "!border-yellow-500/50 !bg-yellow-500/10 !text-yellow-400 shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--warning)_20%,transparent)]";
                        iconClass = "!text-yellow-400";
                    }

                    return (
                        <StaggerItem key={role.name}>
                            <button
                                onClick={() => setSelectedRole(role.name)}
                                className={`group relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${btnClass}`}
                            >
                                <role.icon className={`w-4 h-4 transition-colors ${iconClass}`} />
                                {role.name}
                                {indicator}
                            </button>
                        </StaggerItem>
                    );
                })}
            </StaggerContainer>

            <FadeIn delay={0.2} className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Main Role</span>
                </div>
                <div className="flex items-center gap-1.5 text-yellow-400">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Slide Role</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Custom / Additional</span>
                </div>
            </FadeIn>

            {/* Additional Custom Roles */}
            {customSlideRoles.length > 0 && (
                <FadeIn delay={0.3} className="mt-4">
                    <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Additional Discovered Roles</div>
                    <div className="flex flex-wrap gap-2">
                        {customSlideRoles.map((cRole, idx) => (
                            <div
                                key={idx}
                                className="group relative flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 border-sky-500 bg-sky-500/10 text-sky-300 shadow-[0_0_20px_-5px_color-mix(in_srgb,var(--primary)_30%,transparent)]"
                            >
                                <FileText className="w-3.5 h-3.5 text-sky-400" />
                                {cRole}
                            </div>
                        ))}
                    </div>
                </FadeIn>
            )}

            {selectedRole === "Other" && (
                <FadeIn delay={0.1} className="mt-4">
                    <Input
                        type="text"
                        placeholder="E.g., Blockchain Engineer"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        className="bg-red-500/5 border-red-500/50 text-red-400 placeholder:text-red-400/50 h-12 rounded-xl focus-visible:ring-red-500/30 font-mono text-sm"
                    />
                </FadeIn>
            )}
        </div>
    );
}

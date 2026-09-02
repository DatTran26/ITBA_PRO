"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Database, Settings, FileText, Users, GitBranch } from "lucide-react";

const links = [
    { href: "/dashboard/settings", label: "Settings", desc: "System configuration", icon: Settings, color: "#7C8FFF" },
    { href: "/dashboard/templates", label: "Templates", desc: "Assessment templates", icon: FileText, color: "#36DDAB" },
    { href: "/dashboard/question-bank", label: "Question Bank", desc: "AI-generated assessment bank", icon: Database, color: "#7C8FFF" },
    { href: "/dashboard/users", label: "Users", desc: "User management", icon: Users, color: "#B48EFF" },
    { href: "/dashboard/versions", label: "Versions", desc: "Version history", icon: GitBranch, color: "#FFB86C" },
];

export default function AdminQuickLinks() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <Link key={link.href} href={link.href}>
                        <Card className="border-[#8B99B0]/10 bg-[#1B253B] hover:bg-[#222C4A] p-4 transition-colors cursor-pointer group">
                            <div className="p-2 rounded-lg w-fit mb-2" style={{ backgroundColor: `${link.color}15` }}>
                                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: link.color }} />
                            </div>
                            <p className="text-sm font-medium text-[#ECF0F7]/90">{link.label}</p>
                            <p className="text-[11px] text-[#5A6882]">{link.desc}</p>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

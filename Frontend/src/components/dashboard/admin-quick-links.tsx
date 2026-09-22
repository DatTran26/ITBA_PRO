"use client";
import { alpha } from "@/lib/utils";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Database, Settings, FileText, Users, GitBranch } from "lucide-react";

const links = [
    { href: "/dashboard/settings", label: "Settings", desc: "System configuration", icon: Settings, color: "var(--primary)" },
    { href: "/dashboard/templates", label: "Templates", desc: "Assessment templates", icon: FileText, color: "var(--success)" },
    { href: "/dashboard/question-bank", label: "Question Bank", desc: "AI-generated assessment bank", icon: Database, color: "var(--primary)" },
    { href: "/dashboard/users", label: "Users", desc: "User management", icon: Users, color: "var(--ai)" },
    { href: "/dashboard/versions", label: "Versions", desc: "Version history", icon: GitBranch, color: "var(--warning)" },
];

export default function AdminQuickLinks() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {links.map((link) => {
                const Icon = link.icon;
                return (
                    <Link key={link.href} href={link.href}>
                        <Card className="border-muted-foreground/10 bg-muted hover:bg-accent p-4 transition-colors cursor-pointer group">
                            <div className="p-2 rounded-lg w-fit mb-2" style={{ backgroundColor: `${alpha(link.color, 8)}` }}>
                                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: link.color }} />
                            </div>
                            <p className="text-sm font-medium text-foreground/90">{link.label}</p>
                            <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

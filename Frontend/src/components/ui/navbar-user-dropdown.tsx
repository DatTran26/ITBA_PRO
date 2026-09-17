"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown } from "lucide-react";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface NavbarUser {
    name: string;
    email: string;
    role: string;
}

type DropdownVariant = "topnav" | "sidebar-expanded" | "sidebar-collapsed";

interface NavbarUserDropdownProps {
    user: NavbarUser | null;
    /**
     * topnav (default): horizontal trigger with hover bg, dropdown opens DOWN-END.
     * sidebar-expanded: full-width row at sidebar bottom, opens UP-START.
     * sidebar-collapsed: avatar only, centered, opens RIGHT.
     */
    variant?: DropdownVariant;
}

export default function NavbarUserDropdown({ user, variant = "topnav" }: NavbarUserDropdownProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        // Also clear dev auth cookie (face-login / dev-login sessions)
        await fetch("/api/dev-logout", { method: "POST" }).catch(() => {});
        router.push("/login");
        router.refresh();
    }

    if (!user) {
        const skeletonClass = variant === "sidebar-expanded"
            ? "h-12 rounded-xl bg-[#1E2840] border border-[#8B99B0]/15 animate-pulse"
            : "w-8 h-8 rounded-full bg-[#1E2840] border border-[#8B99B0]/15 animate-pulse";
        return <div className={skeletonClass} />;
    }

    const initial = user.name?.charAt(0).toUpperCase() || "U";

    /* Per-variant trigger classes — keeps 1 menu content for DRY. */
    const triggerByVariant: Record<DropdownVariant, string> = {
        "topnav":
            "flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#1E2840]/60 transition-colors cursor-pointer outline-none",
        "sidebar-expanded":
            "w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#1E2840]/60 transition-colors cursor-pointer outline-none",
        "sidebar-collapsed":
            "w-full flex items-center justify-center p-1.5 rounded-xl hover:bg-[#1E2840]/60 transition-colors cursor-pointer outline-none",
    };

    /* Radix Dropdown placement per variant. */
    const contentSide = variant === "sidebar-expanded" ? "top" : variant === "sidebar-collapsed" ? "right" : "bottom";
    const contentAlign = variant === "topnav" ? "end" : "start";

    const showText = variant === "sidebar-expanded" || variant === "topnav";
    /* Topnav hides text below lg; sidebar-expanded always shows it. */
    const textWrapperClass = variant === "topnav"
        ? "hidden lg:flex flex-col items-start min-w-0 flex-1"
        : "flex flex-col items-start min-w-0 flex-1";
    const caretClass = variant === "topnav"
        ? "w-3.5 h-3.5 text-[#5A6882] hidden lg:block"
        : "w-3.5 h-3.5 text-[#5A6882]";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={triggerByVariant[variant]}>
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C8FFF]/20 to-[#B48EFF]/20 border border-[#8B99B0]/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#7C8FFF]">{initial}</span>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#36DDAB] border-2 border-[#101828]" />
                </div>
                {showText && (
                    <>
                        <div className={textWrapperClass}>
                            <span className="text-sm font-medium text-[#ECF0F7]/90 leading-none truncate w-full">{user.name}</span>
                            <span className="text-[10px] text-[#8B99B0] mt-0.5 uppercase tracking-wider">{user.role || "Recruiter"}</span>
                        </div>
                        <ChevronDown className={caretClass} />
                    </>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align={contentAlign}
                side={contentSide}
                sideOffset={8}
                className="w-56 bg-[#151D2E] border border-[#8B99B0]/15 rounded-xl shadow-2xl shadow-black/50 p-1.5"
            >
                {/* User info header */}
                <div className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C8FFF]/20 to-[#B48EFF]/20 border border-[#8B99B0]/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[#7C8FFF]">{initial}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#ECF0F7] truncate">{user.name}</p>
                            <p className="text-[11px] text-[#5A6882] truncate">{user.email}</p>
                        </div>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-[#8B99B0]/10 mx-1" />

                <Link href="/dashboard/profile">
                    <DropdownMenuItem className="px-3 py-2 text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-[#1E2840] rounded-lg cursor-pointer gap-2.5 text-sm">
                        <User className="w-4 h-4" />
                        My Profile
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator className="bg-[#8B99B0]/10 mx-1" />

                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-3 py-2 text-[#FF6B82] hover:text-[#FF6B82] hover:bg-[#FF6B82]/10 rounded-lg cursor-pointer gap-2.5 text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Signing out..." : "Logout"}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

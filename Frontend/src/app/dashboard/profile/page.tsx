import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/ui/page-container";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { PremiumBackground } from "@/components/ui/premium-background";
import { PageTransition, FadeIn } from "@/components/ui/motion-wrapper";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

    if (!userRecord) {
        userRecord = {
            id: user.id,
            auth_id: user.id,
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
            email: user.email || "",
            role: "super_admin",
            created_at: new Date().toISOString(),
        };
    }

    const createdAt = userRecord.created_at ? new Date(userRecord.created_at).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : "N/A";

    return (
        <PageTransition className="min-h-screen bg-transparent text-[#ECF0F7] relative">
            <PremiumBackground />

            <AppNavbar />

            <PageContainer>
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />
                <div className="max-w-3xl mx-auto pt-8">
                    <FadeIn>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C8FFF]/20 to-[#B48EFF]/20 border border-[#8B99B0]/20 flex items-center justify-center shadow-lg">
                                <User className="w-8 h-8 text-[#7C8FFF]" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-display font-light text-white italic">User Profile</h1>
                                <p className="text-[#8B99B0] text-sm font-mono uppercase tracking-wider">Identity Management Node</p>
                            </div>
                        </div>

                        <Card className="bg-[#1B253B]/40 border-[#8B99B0]/15 backdrop-blur-xl overflow-hidden rounded-3xl relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#7C8FFF]/5 via-transparent to-transparent pointer-events-none" />
                            <CardHeader className="border-b border-[#8B99B0]/10 pb-6">
                                <CardTitle className="text-lg font-medium text-[#ECF0F7] flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#36DDAB]" />
                                    Account Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-[#5A6882] font-mono uppercase tracking-widest">Full Name</p>
                                        <div className="flex items-center gap-3 text-[#ECF0F7]">
                                            <User className="w-4 h-4 text-[#7C8FFF]/60" />
                                            <span className="text-lg">{userRecord.name}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] text-[#5A6882] font-mono uppercase tracking-widest">Email Address</p>
                                        <div className="flex items-center gap-3 text-[#ECF0F7]">
                                            <Mail className="w-4 h-4 text-[#7C8FFF]/60" />
                                            <span className="text-lg font-mono">{userRecord.email}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] text-[#5A6882] font-mono uppercase tracking-widest">Assigned Role</p>
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter border
                                                ${userRecord.role === 'super_admin' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                                  userRecord.role === 'admin' ? 'bg-[#7C8FFF]/10 border-[#7C8FFF]/30 text-[#7C8FFF]' :
                                                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}
                                            `}>
                                                {userRecord.role || 'Recruiter'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] text-[#5A6882] font-mono uppercase tracking-widest">Member Since</p>
                                        <div className="flex items-center gap-3 text-[#B48EFF]/80">
                                            <Calendar className="w-4 h-4" />
                                            <span>{createdAt}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#8B99B0]/10">
                                    <p className="text-[11px] text-[#5A6882] italic">
                                        Security Notice: Your role and identity permissions are cryptographically locked.
                                        Contact a Super Administrator to modify system access protocols.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </FadeIn>
                </div>
            </PageContainer>
        </PageTransition>
    );
}

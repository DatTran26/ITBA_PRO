"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Key, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion-wrapper";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("New passphrase must be > 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passphrase mismatch detected.");
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            // 1. Update the password
            const { error: authError } = await supabase.auth.updateUser({
                password: password,
                data: { force_password_change: false } // Update metadata to clear flag
            });

            if (authError) throw authError;

            toast.success("Security profile updated. Access granted.");
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition className="min-h-screen bg-[#030305] text-white flex items-center justify-center p-6 font-body">


            <FadeIn className="w-full max-w-md relative z-10">
                <Card className="border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <CardHeader className="pt-10 pb-6 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-8 h-8 text-indigo-400" />
                        </div>
                        <CardTitle className="text-2xl font-light font-display">Identity Resolution Required</CardTitle>
                        <CardDescription className="text-white/40 mt-2">
                            To ensure terminal integrity, you must update your temporary passphrase before proceeding to the command center.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        <form onSubmit={handleUpdatePassword} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-widest text-white/50">New Secure Passphrase</Label>
                                <div className="relative group">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 bg-white/[0.03] border-white/10 focus:border-indigo-500/50 rounded-xl"
                                        placeholder="Min 6 characters"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-widest text-white/50">Confirm Passphrase</Label>
                                <div className="relative group">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 h-12 bg-white/[0.03] border-white/10 focus:border-indigo-500/50 rounded-xl"
                                        placeholder="Repeat for validation"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Authorize Security Update
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </FadeIn>
        </PageTransition>
    );
}

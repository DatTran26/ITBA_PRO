"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion-wrapper";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Mật khẩu mới cần tối thiểu 6 ký tự.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Hai mật khẩu chưa khớp nhau.");
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

            toast.success("Đã đổi mật khẩu.");
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

    return (
        <PageTransition className="tg min-h-screen flex items-center justify-center p-6">
            <FadeIn className="w-full max-w-md">
                <div className="tg-card p-8 sm:p-10">
                    <div className="mb-8">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <KeyRound className="h-6 w-6" />
                        </div>
                        <h1 className="tg-heading text-3xl text-[var(--tg-text)] mb-2">Đặt mật khẩu mới</h1>
                        <p className="text-[15px] text-[var(--tg-muted)]">
                            Bạn đang dùng mật khẩu tạm. Đặt mật khẩu riêng trước khi vào hệ thống.
                        </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-[13px] font-semibold text-[var(--tg-text)]">Mật khẩu mới</Label>
                            <Input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-[var(--stub)] border-[var(--tg-border)] text-[var(--tg-text)] placeholder:text-[var(--tg-faint)] h-12 rounded-xl"
                                placeholder="Tối thiểu 6 ký tự"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-[13px] font-semibold text-[var(--tg-text)]">Nhập lại mật khẩu</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                aria-invalid={mismatch}
                                className="bg-[var(--stub)] border-[var(--tg-border)] text-[var(--tg-text)] placeholder:text-[var(--tg-faint)] h-12 rounded-xl"
                                placeholder="Nhập lại để xác nhận"
                                required
                            />
                            {mismatch && (
                                <p className="text-[13px] text-[var(--tg-error)] mt-1.5 flex items-center gap-1.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--tg-error)]" />
                                    Hai mật khẩu chưa khớp nhau
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="tg-pill w-full h-13 py-3.5 text-[15px] font-semibold border-0 flex items-center justify-center gap-2.5"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Lưu và vào hệ thống <ArrowRight className="h-4 w-4" /></>}
                        </Button>
                    </form>
                </div>
            </FadeIn>
        </PageTransition>
    );
}

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageTransition, FadeIn } from "@/components/ui/motion-wrapper";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, Fingerprint } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email("Invalid email sequence"),
    password: z.string().min(6, "Passphrase must be > 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const turnstileRef = useRef<TurnstileInstance>(null);
    const router = useRouter();
    const isTurnstileEnabled = process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === "true";
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: any) => {
        if (isTurnstileEnabled && (!turnstileSiteKey || !captchaToken)) {
            toast.error("Captcha protection is not configured. Please contact support.");
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            const loginData = data as LoginSchema;
            const signInOptions = captchaToken ? { captchaToken } : undefined;
            const { error, data: authData } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
                ...(isTurnstileEnabled ? { options: { captchaToken } } : {}),
            });

            if (error) throw error;

            // Check security metadata for enforcement protocols
            const { data: { user } } = await supabase.auth.getUser();
            const forceReset = user?.user_metadata?.force_password_change;

            if (forceReset) {
                toast.info("Security protocol triggered: Standard identity reset required.");
                router.push("/reset-password");
            } else {
                toast.success("Neural handshake accepted. Welcome back.");
                router.push("/dashboard");
            }
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Handshake failed";
            toast.error(message);
            setCaptchaToken(undefined);
            turnstileRef.current?.reset();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition className="tg min-h-screen flex overflow-hidden relative">

            {/* Bên trái: mảng thương hiệu, ẩn trên mobile */}
            <div className="hidden lg:flex w-[46%] relative items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primary">
                <div className="absolute -top-[12%] -left-[8%] w-96 h-96 rounded-full bg-white/15 blur-[110px]" aria-hidden="true" />
                <div className="absolute -bottom-[10%] -right-[6%] w-80 h-80 rounded-full bg-primary/25 blur-[100px]" aria-hidden="true" />

                <div className="relative z-10 p-16 max-w-xl">
                    <Link href="/" className="inline-flex items-center gap-3 group mb-16">
                        <div className="w-12 h-12 rounded-2xl bg-white/95 flex items-center justify-center text-primary tg-display text-base shadow-lg group-hover:scale-105 transition-transform">
                            IT
                        </div>
                        <span className="tg-display text-2xl text-white">ITBA</span>
                    </Link>

                    <h1 className="tg-display text-[2.75rem] leading-[1.14] text-white mb-7">
                        Tuyển đúng người,<br />
                        <span className="text-primary">nhanh hơn một nửa</span>
                    </h1>

                    <p className="text-white/85 text-lg leading-relaxed mb-10 max-w-md">
                        AI chấm CV và bài test kỹ thuật, ghi lại căn cứ cho từng quyết định.
                        Quyền quyết định cuối cùng vẫn thuộc về bạn.
                    </p>

                    <div className="flex items-center gap-3 text-sm text-white/80">
                        <Fingerprint className="w-5 h-5" />
                        <span>Dữ liệu ứng viên được phân quyền theo vai trò</span>
                    </div>
                </div>
            </div>

            {/* Bên phải: biểu mẫu đăng nhập */}
            <div className="flex-1 flex items-center justify-center relative p-6">
                <div className="w-full max-w-md relative z-10">
                    <FadeIn delay={0.1}>
                        <div className="mb-10 lg:hidden flex justify-center">
                            <Link href="/">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white tg-display text-lg shadow-[var(--sh-m)]">
                                    IT
                                </div>
                            </Link>
                        </div>

                        <div className="tg-card p-8 sm:p-10">
                            <div className="mb-8">
                                <h2 className="tg-heading text-3xl text-[var(--tg-text)] mb-2">
                                    Đăng nhập
                                </h2>
                                <p className="text-[15px] text-[var(--tg-muted)]">
                                    Nhập tài khoản được cấp để vào hệ thống tuyển dụng.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="text-[13px] font-semibold text-[var(--tg-text)]">
                                        Email công việc
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ten.ban@congty.vn"
                                        className="bg-[var(--stub)] border-[var(--tg-border)] hover:border-border focus:border-border text-[var(--tg-text)] placeholder:text-[var(--tg-faint)] h-12 rounded-xl transition-all"
                                        {...register("email")}
                                    />
                                    {errors.email && (
                                        <p className="text-[13px] text-[var(--tg-error)] mt-1.5 flex items-center gap-1.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--tg-error)]" />
                                            {errors.email.message as string}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 group">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-[13px] font-semibold text-[var(--tg-text)]">
                                            Mật khẩu
                                        </Label>
                                        <Link href="/reset-password" className="text-[13px] font-semibold text-[var(--p-deep)] hover:text-[var(--p-ink)] transition-colors">
                                            Quên mật khẩu?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="bg-[var(--stub)] border-[var(--tg-border)] hover:border-border focus:border-border text-[var(--tg-text)] placeholder:text-[var(--tg-faint)] h-12 rounded-xl transition-all"
                                        {...register("password")}
                                    />
                                    {errors.password && (
                                        <p className="text-[13px] text-[var(--tg-error)] mt-1.5 flex items-center gap-1.5 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--tg-error)]" />
                                            {errors.password.message as string}
                                        </p>
                                    )}
                                </div>

                                {isTurnstileEnabled && (
                                    <div className="py-1">
                                        {turnstileSiteKey ? (
                                            <Turnstile
                                                ref={turnstileRef}
                                                siteKey={turnstileSiteKey}
                                                onSuccess={(token) => setCaptchaToken(token)}
                                                onExpire={() => {
                                                    setCaptchaToken(undefined);
                                                    turnstileRef.current?.reset();
                                                }}
                                                onError={() => {
                                                    setCaptchaToken(undefined);
                                                    turnstileRef.current?.reset();
                                                }}
                                                options={{ theme: "light", size: "flexible" }}
                                            />
                                        ) : (
                                            <p className="text-sm text-[var(--tg-error)]" role="alert">
                                                Chưa cấu hình captcha. Vui lòng liên hệ quản trị viên.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || (isTurnstileEnabled && (!turnstileSiteKey || !captchaToken))}
                                    className="tg-pill w-full h-13 py-3.5 text-[15px] font-semibold border-0 flex items-center justify-center gap-2.5 group/btn hover:-translate-y-[1px] active:translate-y-0 transition-transform"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Đang đăng nhập...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Đăng nhập</span>
                                            <ArrowRight className="w-[18px] h-[18px] group-hover/btn:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>

                        <p className="mt-6 text-center text-[13px] text-[var(--tg-muted)]">
                            Chưa có tài khoản? Liên hệ quản trị viên của công ty bạn.
                        </p>
                    </FadeIn>
                </div>
            </div>
        </PageTransition>
    );
}

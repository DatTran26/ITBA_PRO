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

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            const loginData = data as LoginSchema;
            const signInOptions = captchaToken ? { captchaToken } : undefined;
            const { error, data: authData } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
                ...(signInOptions ? { options: signInOptions } : {}),
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
        <PageTransition className="min-h-screen bg-[#121A2E] text-[#ECF0F7] flex overflow-hidden font-body selection:bg-[#7C8FFF]/30 relative">

            {/* Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_30%,rgba(91,108,240,0.08)_0%,transparent_50%)]" />
            </div>

            {/* Left: Decorative Brand Side (Hidden on Mobile) */}
            <div className="hidden lg:flex w-[45%] relative bg-[#161F35] items-center justify-center border-r border-white/5 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#7C8FFF]/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-[#B48EFF]/10 blur-[100px] rounded-full" />

                <div className="relative z-10 p-16 max-w-xl">
                    <Link href="/" className="inline-flex items-center gap-4 group cursor-pointer mb-20 animate-in fade-in slide-in-from-left duration-700">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B6CF0] to-[#7C8FFF] flex items-center justify-center text-white font-black text-lg shadow-[0_10px_25px_-5px_rgba(91,108,240,0.5)] group-hover:scale-110 transition-all duration-500 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            AI
                        </div>
                        <span className="text-2xl font-bold tracking-tighter text-[#ECF0F7] group-hover:text-white transition-colors font-display uppercase italic">
                            ITBA<span className="text-[#7C8FFF]">.CORE</span>
                        </span>
                    </Link>

                    <h1 className="text-5xl font-light font-display leading-[1.1] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                        Automate the <br />
                        <span className="relative inline-block mt-2">
                             <span className="absolute -inset-1 block bg-[#5B6CF0]/20 blur-xl rounded-full" aria-hidden="true" />
                             <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-[#7C8FFF] to-[#B48EFF] font-semibold">Technical Protocol.</span>
                        </span>
                    </h1>

                    <p className="text-[#8B99B0] font-light text-xl leading-relaxed mb-12 max-w-md animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                        The definitive command center for engineering excellence and autonomous technical screening.
                    </p>

                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] text-[#5A6882] animate-in fade-in duration-1000 delay-500">
                        <Fingerprint className="w-5 h-5 text-[#7C8FFF]/40" />
                        <span>Biometric-Grade Intelligence</span>
                    </div>
                </div>
            </div>

            {/* Right: Auth Form */}
            <div className="flex-1 flex items-center justify-center relative p-6">
                <div className="w-full max-w-md relative z-10">

                    <FadeIn delay={0.1}>
                        <div className="mb-12 lg:hidden flex justify-center">
                            <Link href="/">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B6CF0] to-[#7C8FFF] flex items-center justify-center text-white font-black text-xl shadow-[0_10px_25px_-5px_rgba(91,108,240,0.5)]">
                                    AI
                                </div>
                            </Link>
                        </div>

                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-4xl font-semibold font-display text-[#ECF0F7] mb-3 tracking-tight">
                                Establish Link
                            </h2>
                            <p className="text-[#8B99B0] text-lg font-light">
                                Enter your designated credentials to access the recruitment matrix.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2.5 group">
                                <Label htmlFor="email" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors ml-1">Communication Link</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="agent@itba.system"
                                    className="bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="text-xs text-[#FF6B82] mt-1.5 flex items-center gap-1.5 font-medium ml-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B82]" />
                                        {errors.email.message as string}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2.5 group">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors">Security Passphrase</Label>
                                    <Link href="#" className="text-[11px] font-bold text-[#7C8FFF]/60 hover:text-[#7C8FFF] transition-colors uppercase tracking-widest">Lost access?</Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="text-xs text-[#FF6B82] mt-1.5 flex items-center gap-1.5 font-medium ml-1">
                                         <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B82]" />
                                         {errors.password.message as string}
                                    </p>
                                )}
                            </div>

                            <div className="py-2">
                                <Turnstile
                                    ref={turnstileRef}
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                                    onSuccess={(token) => setCaptchaToken(token)}
                                    onExpire={() => {
                                        setCaptchaToken(undefined);
                                        turnstileRef.current?.reset();
                                    }}
                                    onError={() => {
                                        setCaptchaToken(undefined);
                                        turnstileRef.current?.reset();
                                    }}
                                    options={{ theme: "dark", size: "flexible" }}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || (!captchaToken && process.env.NODE_ENV === "production")}
                                className="w-full h-14 bg-[#5B6CF0] hover:bg-[#4F5FE0] text-white font-bold text-base border-0 transition-all hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_15px_30px_-5px_rgba(91,108,240,0.5)] flex items-center justify-center gap-3 group/btn rounded-[1.25rem]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Initiating Handshake...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Establish Connection</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </FadeIn>
                </div>
            </div>
        </PageTransition>
    );
}

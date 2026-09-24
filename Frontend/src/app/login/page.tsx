"use client";

import { useEffect, useState, useRef } from "react";
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
import { Loader2, ArrowRight, Fingerprint, ScanFace, Camera, Check, X, UserPlus, LogIn } from "lucide-react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import Image from "next/image";
import { readApiResponse } from "@/lib/api-response";

const loginSchema = z.object({
    email: z.string().email("Invalid email sequence"),
    password: z.string().min(6, "Passphrase must be > 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

const REG_ANGLES_DETAIL = [
    { name: "Front", hint: "Look directly at the camera" },
    { name: "Left", hint: "Turn your face 15-30 degrees to the left" },
    { name: "Right", hint: "Turn your face 15-30 degrees to the right" },
    { name: "Looking up", hint: "Raise your chin slightly" },
    { name: "Looking down", hint: "Lower your head slightly" },
    { name: "Natural / Smile", hint: "Smile or use a natural expression" },
];
const REG_ANGLES = REG_ANGLES_DETAIL.map((d) => d.name);
type Capture = { file: File; url: string };

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
    const [isLoading, setIsLoading] = useState(false);
    const [isFaceLoginOpen, setIsFaceLoginOpen] = useState(false);
    const [isFaceBusy, setIsFaceBusy] = useState(false);
    const [faceAttempts, setFaceAttempts] = useState(0);
    const [isFaceAutoScanning, setIsFaceAutoScanning] = useState(false);
    const [faceCameras, setFaceCameras] = useState<MediaDeviceInfo[]>([]);
    const [faceCameraIndex, setFaceCameraIndex] = useState(0);
    const [regCaptures, setRegCaptures] = useState<Array<Capture | null>>(() => REG_ANGLES.map(() => null));
    const [regActiveAngle, setRegActiveAngle] = useState(0);
    const [isRegBusy, setIsRegBusy] = useState(false);
    const [regCameraOn, setRegCameraOn] = useState(false);
    const [registrationName, setRegistrationName] = useState("");
    const [registrationEmail, setRegistrationEmail] = useState("");
    const [registrationPassword, setRegistrationPassword] = useState("");
    const [registrationConfirmPassword, setRegistrationConfirmPassword] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);

    // 1-touch 3s auto-capture state
    const [isAutoCapturing, setIsAutoCapturing] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
    const autoCapturingRef = useRef(false);
    const [captchaToken, setCaptchaToken] = useState<string>();
    const turnstileRef = useRef<TurnstileInstance>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const regVideoRef = useRef<HTMLVideoElement>(null);
    const regCanvasRef = useRef<HTMLCanvasElement>(null);
    const regStreamRef = useRef<MediaStream | null>(null);
    const router = useRouter();
    const isDevAuthBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
    const isTurnstileEnabled = !isDevAuthBypass && process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === "true";
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
    } = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "",
        },
    });

    const onSubmit = async (data: LoginSchema) => {
        if (isTurnstileEnabled && (!turnstileSiteKey || !captchaToken)) {
            toast.error("Captcha protection is not configured. Please contact support.");
            return;
        }

        setIsLoading(true);

        try {
            const loginData = data as LoginSchema;
            if (isDevAuthBypass) {
                const response = await fetch("/api/dev-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(loginData),
                });
                if (response.ok) {
                    toast.success("Local super admin session active.");
                    router.push("/dashboard");
                    router.refresh();
                    return;
                }
                const devLoginError = await response.json().catch(() => null);
                throw new Error(devLoginError?.error ?? "Local dev login failed");
            }

            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password,
                ...(isTurnstileEnabled ? { options: { captchaToken } } : {}),
            });

            if (error) throw error;

            // Check security metadata for enforcement protocols
            const { data: { user } } = await supabase.auth.getUser();
            const forceReset = user?.user_metadata?.force_password_change;
            const faceReauth = user?.user_metadata?.face_reauth_required;

            if (forceReset) {
                toast.info("Security protocol triggered: Standard identity reset required.");
                router.push("/reset-password");
            } else if (faceReauth) {
                toast.info("An administrator requested a new face capture before you can continue.");
                router.push("/dashboard/my-face");
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

    // --- Face Login functions with Auto-Scan & 3 Attempts limit ---
    async function listFaceCameras() {
        if (!navigator.mediaDevices?.enumerateDevices) return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === "videoinput");
    }

    async function startFaceCamera(nextIndex = faceCameraIndex, autoScan = true) {
        setIsFaceLoginOpen(true);
        if (autoScan) {
            setFaceAttempts(0);
            setIsFaceAutoScanning(true);
        }

        try {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            let stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            let cameras = await listFaceCameras();
            if (!cameras.length) cameras = stream.getVideoTracks().map((track, index) => ({
                deviceId: track.getSettings().deviceId ?? String(index),
                groupId: track.getSettings().groupId ?? "",
                kind: "videoinput" as const,
                label: track.label || `Camera ${index}`,
                toJSON() { return this; },
            }));
            const index = Math.min(Math.max(0, nextIndex), Math.max(0, cameras.length - 1));
            const selected = cameras[index];
            const currentDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
            if (selected?.deviceId && selected.deviceId !== currentDeviceId) {
                stream.getTracks().forEach((track) => track.stop());
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selected.deviceId } },
                    audio: false,
                });
                cameras = await listFaceCameras();
            }
            streamRef.current = stream;
            setFaceCameras(cameras);
            setFaceCameraIndex(index);
            if (videoRef.current) videoRef.current.srcObject = stream;
            if (autoScan) {
                window.setTimeout(() => {
                    void triggerAutoFaceLogin(1);
                }, 1500);
            }
        } catch {
            setIsFaceAutoScanning(false);
            toast.error("Unable to open the camera. Please allow camera access.");
        }
    }

    function stopFaceCamera() {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsFaceLoginOpen(false);
        setIsFaceAutoScanning(false);
    }

    async function triggerAutoFaceLogin(attemptNumber = 1) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) {
            window.setTimeout(() => void triggerAutoFaceLogin(attemptNumber), 500);
            return;
        }

        setIsFaceBusy(true);
        setIsFaceAutoScanning(true);
        try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
            if (!blob) throw new Error("Unable to capture a face image");

            const body = new FormData();
            body.append("image", new File([blob], "face-login.jpg", { type: "image/jpeg" }));
            const response = await fetch("/api/face-login", { method: "POST", body });
            const data = await readApiResponse<{ ok?: boolean; error?: string; redirectUrl?: string }>(response);
            if (!response.ok) throw new Error(data.error ?? "Face does not match");

            toast.success("Face verified successfully!");
            stopFaceCamera();
            router.push(data.redirectUrl ?? "/dashboard");
            router.refresh();
        } catch (error) {
            setFaceAttempts(attemptNumber);
            setIsFaceAutoScanning(false);
            if (attemptNumber >= 3) {
                stopFaceCamera();
                setIsFaceLoginOpen(false);
                toast.error("Face verification failed three times. Sign in with your password.");
                document.getElementById("password")?.focus();
            } else {
                toast.error(
                    error instanceof Error
                        ? `${error.message} (attempt ${attemptNumber}/3). Select Retry below.`
                        : `Face does not match (attempt ${attemptNumber}/3). Select Retry below.`
                );
            }
        } finally {
            setIsFaceBusy(false);
        }
    }

    // --- Face Registration functions: 1-touch 3s Auto 6-Angle Capture ---
    async function startRegCamera() {
        setRegCameraOn(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            regStreamRef.current = stream;
            if (regVideoRef.current) regVideoRef.current.srcObject = stream;
        } catch {
            toast.error("Unable to open the camera. Please allow camera access.");
        }
    }

    function stopRegCamera() {
        stopAutoCapture();
        regStreamRef.current?.getTracks().forEach((track) => track.stop());
        regStreamRef.current = null;
        setRegCameraOn(false);
    }

    const handleTabChange = (tab: "signin" | "register") => {
        if (tab === "signin") {
            stopRegCamera();
        } else {
            stopFaceCamera();
            setIsFaceLoginOpen(false);
            const currentEmail = getValues("email")?.trim();
            if (currentEmail && !registrationEmail) {
                setRegistrationEmail(currentEmail);
            }
        }
        setActiveTab(tab);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (isDevAuthBypass && params.get("tab") === "register") {
                setActiveTab("register");
            }
        }
    }, [isDevAuthBypass]);

    function closeFaceRegister() {
        stopAutoCapture();
        stopRegCamera();
        regCaptures.forEach((c) => c && URL.revokeObjectURL(c.url));
        setRegCaptures(REG_ANGLES.map(() => null));
        setRegActiveAngle(0);
        setRegistrationName("");
        setRegistrationEmail("");
        setRegistrationPassword("");
        setRegistrationConfirmPassword("");
        setShowRegPassword(false);
    }

    function stopAutoCapture() {
        autoCapturingRef.current = false;
        setIsAutoCapturing(false);
        setAutoCountdown(null);
    }

    async function startAuto6AngleCapture() {
        const name = registrationName.trim();
        const email = registrationEmail.trim().toLowerCase();
        const password = registrationPassword;
        const confirmPassword = registrationConfirmPassword;

        if (!name) {
            toast.error("Please enter your full name before starting face capture.");
            return;
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Please enter a valid email address before starting face capture.");
            return;
        }
        if (!password || password.length < 6) {
            toast.error("Password must contain at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match. Please verify your password.");
            return;
        }

        if (!regCameraOn || !regStreamRef.current) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                regStreamRef.current = stream;
                if (regVideoRef.current) regVideoRef.current.srcObject = stream;
                setRegCameraOn(true);
            } catch {
                toast.error("Unable to open the camera. Please allow camera access.");
                return;
            }
        }

        setIsAutoCapturing(true);
        autoCapturingRef.current = true;
        setRegActiveAngle(0);
        toast.info("Automatic six-angle capture started. One image will be taken every three seconds.");
        runAngleCountdown(0);
    }

    function runAngleCountdown(angleIndex: number) {
        if (!autoCapturingRef.current) return;
        if (angleIndex >= 6) {
            setIsAutoCapturing(false);
            autoCapturingRef.current = false;
            setAutoCountdown(null);
            toast.success("All six angles captured. Select Create Account to finish.");
            return;
        }

        setRegActiveAngle(angleIndex);
        setAutoCountdown(3);

        let currentSec = 3;
        const timer = window.setInterval(() => {
            if (!autoCapturingRef.current) {
                window.clearInterval(timer);
                return;
            }
            currentSec -= 1;
            if (currentSec > 0) {
                setAutoCountdown(currentSec);
            } else {
                window.clearInterval(timer);
                setAutoCountdown(0);
                void snapPhotoForAngle(angleIndex).then((success) => {
                    if (success && autoCapturingRef.current) {
                        window.setTimeout(() => {
                            runAngleCountdown(angleIndex + 1);
                        }, 400);
                    } else {
                        stopAutoCapture();
                    }
                });
            }
        }, 1000);
    }

    async function snapPhotoForAngle(angleIndex: number): Promise<boolean> {
        const video = regVideoRef.current;
        const canvas = regCanvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) {
            toast.error("Camera is not ready to capture " + REG_ANGLES[angleIndex]);
            return false;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) {
            toast.error("Unable to capture the " + REG_ANGLES[angleIndex] + " angle");
            return false;
        }
        const file = new File([blob], `face-reg-${angleIndex + 1}.jpg`, { type: "image/jpeg" });
        setRegCaptures((current) => {
            if (current[angleIndex]) URL.revokeObjectURL(current[angleIndex]!.url);
            const next = [...current];
            next[angleIndex] = { file, url: URL.createObjectURL(file) };
            return next;
        });
        toast.info(`Captured angle ${angleIndex + 1}/6: ${REG_ANGLES[angleIndex]}`);
        return true;
    }

    async function captureRegAngle() {
        void snapPhotoForAngle(regActiveAngle);
        const nextEmpty = regCaptures.findIndex((c, i) => i > regActiveAngle && !c);
        if (nextEmpty !== -1) setRegActiveAngle(nextEmpty);
    }

    async function submitFaceRegistration() {
        const name = registrationName.trim();
        const email = registrationEmail.trim().toLowerCase();
        const password = registrationPassword;
        const confirmPassword = registrationConfirmPassword;

        if (!name) {
            toast.error("Enter your full name before registering.");
            return;
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Enter a valid email address before registering.");
            return;
        }
        if (!password || password.length < 6) {
            toast.error("Enter a password containing at least 6 characters.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match. Please verify your password.");
            return;
        }
        if (regCaptures.some((c) => !c)) {
            toast.error("Please capture all six face angles.");
            return;
        }
        setIsRegBusy(true);
        try {
            const body = new FormData();
            body.append("name", name);
            body.append("email", email);
            body.append("password", password);
            regCaptures.forEach((c) => body.append("images", c!.file));
            const response = await fetch("/api/register", { method: "POST", body });
            const data = await readApiResponse<{ ok?: boolean; error?: string; message?: string }>(response);
            if (!response.ok) throw new Error(data.error ?? "Account registration failed");
            toast.success(data.message ?? "Account created successfully!");
            setValue("email", email);
            closeFaceRegister();
            handleTabChange("signin");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Account registration failed");
        } finally {
            setIsRegBusy(false);
        }
    }

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        regStreamRef.current?.getTracks().forEach((track) => track.stop());
    }, []);

    return (
        <PageTransition className="min-h-screen bg-[#121A2E] text-[#ECF0F7] flex font-body selection:bg-[#7C8FFF]/30 relative">

            {/* Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_30%,rgba(91,108,240,0.08)_0%,transparent_50%)]" />
            </div>

            {/* Left: Decorative Brand Side (Hidden on Mobile) */}
            <div className="hidden lg:flex w-[45%] min-h-screen relative bg-[#161F35] items-center justify-center border-r border-white/5 overflow-hidden sticky top-0">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#7C8FFF]/15 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-[#B48EFF]/10 blur-[100px] rounded-full" />

                <div className="relative z-10 p-16 max-w-xl">
                    <Link href="/" className="inline-flex items-center gap-4 group cursor-pointer mb-20 animate-in fade-in slide-in-from-left duration-700">
                        <Image
                            src="/logo.png"
                            alt="Town Hown"
                            width={545}
                            height={398}
                            className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
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
            <div className="flex-1 flex items-center justify-center relative p-6 sm:p-10 min-h-screen overflow-y-auto py-12">
                <div className="w-full max-w-lg relative z-10 my-auto">

                    <FadeIn delay={0.1}>
                        <div className="mb-6 lg:hidden flex justify-center">
                            <Link href="/">
                                <Image
                                    src="/logo.png"
                                    alt="Town Hown"
                                    width={545}
                                    height={398}
                                    className="h-16 w-auto object-contain"
                                    priority
                                />
                            </Link>
                        </div>

                        {isDevAuthBypass && (
                        <div className="grid grid-cols-2 p-1.5 bg-[#0B1220]/90 rounded-2xl border border-white/10 mb-8 backdrop-blur-md shadow-inner">
                            <button
                                type="button"
                                onClick={() => handleTabChange("signin")}
                                className={`flex items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-[0.12em] rounded-xl transition-all ${
                                    activeTab === "signin"
                                        ? "bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/25"
                                        : "text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/5"
                                }`}
                            >
                                <LogIn className="size-4" />
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTabChange("register")}
                                className={`flex items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-[0.12em] rounded-xl transition-all ${
                                    activeTab === "register"
                                        ? "bg-[#5B6CF0] text-white shadow-lg shadow-[#5B6CF0]/25"
                                        : "text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/5"
                                }`}
                            >
                                <UserPlus className="size-4" />
                                Register
                            </button>
                        </div>
                        )}

                        {/* TAB 1: SIGN IN */}
                        {activeTab === "signin" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="mb-4 text-center lg:text-left">
                                    <h2 className="text-4xl font-semibold font-display text-[#ECF0F7] mb-2 tracking-tight">
                                        Establish Link
                                    </h2>
                                    <p className="text-[#8B99B0] text-base font-light">
                                        Enter your designated credentials to access the recruitment matrix.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-2 group">
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

                                    <div className="space-y-2 group">
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
                                                    options={{ theme: "dark", size: "flexible" }}
                                                />
                                            ) : (
                                                <p className="text-sm text-[#FF6B82]" role="alert">
                                                    Captcha protection is not configured. Please contact support.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading || (isTurnstileEnabled && (!turnstileSiteKey || !captchaToken))}
                                        className="w-full h-12 bg-[#5B6CF0] hover:bg-[#4F5FE0] text-white font-bold text-sm border-0 transition-all hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_15px_30px_-5px_rgba(91,108,240,0.5)] flex items-center justify-center gap-3 group/btn rounded-[1.25rem]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Initiating Handshake...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Establish Connection</span>
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                {/* Face ID Sign In Section */}
                                <div className="border-t border-white/10 pt-5">
                                    {!isFaceLoginOpen ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 rounded-[1rem] border-white/10 bg-[#1B253B]/40 text-[#ECF0F7] hover:bg-[#24304A] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                                            onClick={() => {
                                                void startFaceCamera(faceCameraIndex, true);
                                            }}
                                        >
                                            <ScanFace className="size-4 text-[#7C8FFF]" />
                                            Face ID Sign In (Instant Scan)
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 rounded-[1rem] border border-[#5B6CF0]/40 bg-[#0B1220]/95 p-3.5 shadow-xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <ScanFace className="size-4 text-[#7C8FFF]" />
                                                    <p className="text-sm font-semibold text-white">Face ID Sign In</p>
                                                </div>
                                                <span className="text-[11px] font-mono text-[#8B99B0]">
                                                    Attempt: <strong className={faceAttempts >= 2 ? "text-[#FF6B82]" : "text-[#34D399]"}>{faceAttempts}/3</strong>
                                                </span>
                                            </div>

                                            <label className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5A6882]">
                                                Camera index
                                                <select
                                                    className="mt-1.5 h-9 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 text-sm font-normal normal-case tracking-normal text-[#ECF0F7]"
                                                    value={String(faceCameraIndex)}
                                                    disabled={isFaceBusy}
                                                    onChange={(event) => {
                                                        const index = Number(event.target.value);
                                                        setFaceCameraIndex(index);
                                                        void startFaceCamera(index, false);
                                                    }}
                                                    aria-label="Camera index"
                                                >
                                                    {(faceCameras.length ? faceCameras : [{ deviceId: "default", label: "Camera 0" } as MediaDeviceInfo]).map((device, index) => (
                                                        <option key={device.deviceId || String(index)} value={String(index)}>
                                                            Camera {index}{device.label ? ` — ${device.label}` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <div className="relative overflow-hidden rounded-xl bg-black aspect-video border border-white/10">
                                                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                                                <canvas ref={canvasRef} className="hidden" />

                                                {isFaceAutoScanning && (
                                                    <div className="absolute inset-0 bg-[#5B6CF0]/10 flex flex-col items-center justify-center backdrop-blur-[1px]">
                                                        <div className="size-16 rounded-full border-2 border-[#5B6CF0] border-t-transparent animate-spin mb-2" />
                                                        <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full border border-white/10">
                                                            Scanning face automatically...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-center text-xs text-[#8B99B0]">
                                                {isFaceAutoScanning ? (
                                                     <span className="text-[#34D399]">Hold still and look directly into the camera</span>
                                                ) : faceAttempts > 0 ? (
                                                    <span className="text-[#FF6B82]">
                                                        Face did not match. Select Retry or use your password.
                                                    </span>
                                                ) : (
                                                    <span>Look directly at the camera to automatically scan and sign in.</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    disabled={isFaceBusy}
                                                    className="bg-[#5B6CF0] hover:bg-[#4F5FE0] text-white text-xs font-semibold h-10"
                                                    onClick={() => triggerAutoFaceLogin(faceAttempts + 1)}
                                                >
                                                    {isFaceBusy ? (
                                                        <Loader2 className="animate-spin size-4" />
                                                    ) : (
                                                        `Retry (Attempt ${Math.min(3, faceAttempts + 1)}/3)`
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={isFaceBusy}
                                                    className="border-white/10 bg-[#1B253B]/50 text-xs h-10"
                                                    onClick={() => {
                                                        stopFaceCamera();
                                                        setIsFaceLoginOpen(false);
                                                        document.getElementById("password")?.focus();
                                                    }}
                                                >
                                                    Use Password
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="text-center text-xs text-[#8B99B0] pt-2">
                                    Internal accounts are provisioned by an administrator.
                                </p>
                            </div>
                        )}

                        {/* TAB 2: REGISTER */}
                        {isDevAuthBypass && activeTab === "register" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="mb-4 text-center lg:text-left">
                                    <h2 className="text-4xl font-semibold font-display text-[#ECF0F7] mb-2 tracking-tight">
                                        Create Account
                                    </h2>
                                    <p className="text-[#8B99B0] text-base font-light">
                                        Provision a new biometric-verified user identity.
                                    </p>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        void submitFaceRegistration();
                                    }}
                                    className="space-y-5"
                                >
                                    {/* Credentials Inputs */}
                                    <div className="space-y-2 group">
                                        <Label htmlFor="reg-name" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors ml-1">
                                            Full Name <span className="text-[#7C8FFF]">*</span>
                                        </Label>
                                        <Input
                                            id="reg-name"
                                            value={registrationName}
                                            onChange={(e) => setRegistrationName(e.target.value)}
                                            placeholder="e.g. Alex Morgan"
                                            className="bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2 group">
                                        <Label htmlFor="reg-email" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors ml-1">
                                            Communication Link (Email) <span className="text-[#7C8FFF]">*</span>
                                        </Label>
                                        <Input
                                            id="reg-email"
                                            type="email"
                                            value={registrationEmail}
                                            onChange={(e) => setRegistrationEmail(e.target.value)}
                                            placeholder="agent@itba.system"
                                            className="bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300 text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2 group">
                                            <div className="flex items-center justify-between ml-1">
                                                <Label htmlFor="reg-password" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors">
                                                    Security Passphrase <span className="text-[#7C8FFF]">*</span>
                                                </Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRegPassword(!showRegPassword)}
                                                    className="text-[10px] font-bold text-[#7C8FFF]/60 hover:text-[#7C8FFF] transition-colors uppercase tracking-wider"
                                                >
                                                    {showRegPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                            <Input
                                                id="reg-password"
                                                type={showRegPassword ? "text" : "password"}
                                                value={registrationPassword}
                                                onChange={(e) => setRegistrationPassword(e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className="bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-2 group">
                                            <Label htmlFor="reg-confirm-password" className="text-[11px] font-bold text-[#5A6882] uppercase tracking-[0.2em] group-focus-within:text-[#7C8FFF] transition-colors ml-1">
                                                Confirm Passphrase <span className="text-[#7C8FFF]">*</span>
                                            </Label>
                                            <Input
                                                id="reg-confirm-password"
                                                type={showRegPassword ? "text" : "password"}
                                                value={registrationConfirmPassword}
                                                onChange={(e) => setRegistrationConfirmPassword(e.target.value)}
                                                placeholder="Repeat passphrase"
                                                className={`bg-[#1B253B]/60 border-white/5 hover:border-[#7C8FFF]/30 focus:border-[#7C8FFF]/50 text-[#ECF0F7] placeholder:text-[#5A6882]/50 h-12 rounded-[1rem] transition-all duration-300 text-sm ${
                                                    registrationConfirmPassword && registrationPassword !== registrationConfirmPassword
                                                        ? "border-rose-500/60 focus:border-rose-500"
                                                        : ""
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Biometric Face Capture Section */}
                                    <div className="border-t border-white/10 pt-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <ScanFace className="size-4 text-[#7C8FFF]" />
                                                    <h3 className="text-sm font-semibold text-[#ECF0F7]">Biometric Face Signature</h3>
                                                </div>
                                                <p className="text-xs text-[#8B99B0] mt-0.5">All 6 facial perspectives required for neural verification</p>
                                            </div>
                                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#5B6CF0]/10 text-[#7C8FFF] border border-[#5B6CF0]/20">
                                                {regCaptures.filter(Boolean).length}/6 Angles
                                            </span>
                                        </div>

                                        {!isAutoCapturing ? (
                                            <Button
                                                type="button"
                                                className="w-full h-12 bg-gradient-to-r from-[#5B6CF0] to-[#7C8FFF] hover:from-[#4F5FE0] hover:to-[#6C7FF0] text-white font-bold text-xs rounded-[1rem] shadow-[0_10px_25px_-5px_rgba(91,108,240,0.4)] flex items-center justify-center gap-2 transition-all"
                                                onClick={startAuto6AngleCapture}
                                            >
                                                <ScanFace className="size-4" />
                                                Automatic 6-Angle Capture (1 snapshot every 3s)
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="w-full h-12 text-xs rounded-[1rem] font-bold flex items-center justify-center gap-2 shadow-lg"
                                                onClick={stopAutoCapture}
                                            >
                                                <X className="size-4" /> Stop Automatic Capture
                                            </Button>
                                        )}

                                        <div className="relative overflow-hidden rounded-[1rem] bg-black aspect-video border border-white/10 shadow-lg">
                                            <video ref={regVideoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                                            <canvas ref={regCanvasRef} className="hidden" />

                                            {isAutoCapturing && autoCountdown !== null && (
                                                <div className="absolute inset-0 bg-[#0A0F1E]/65 backdrop-blur-[2px] flex flex-col items-center justify-between p-4 pointer-events-none">
                                                    <div className="bg-[#121A2E]/90 px-4 py-1.5 rounded-full border border-white/15 text-center shadow-lg">
                                                        <p className="text-xs font-bold text-[#7C8FFF]">
                                                            Angle {regActiveAngle + 1}/6: {REG_ANGLES_DETAIL[regActiveAngle]?.name}
                                                        </p>
                                                        <p className="text-[11px] text-[#AEB9CC]">
                                                            {REG_ANGLES_DETAIL[regActiveAngle]?.hint}
                                                        </p>
                                                    </div>

                                                    <div className="size-16 rounded-full bg-[#5B6CF0]/20 border-2 border-[#7C8FFF] flex items-center justify-center animate-pulse shadow-[0_0_25px_rgba(91,108,240,0.5)]">
                                                        <span className="font-mono text-3xl font-black text-white">
                                                            {autoCountdown > 0 ? autoCountdown : "📸"}
                                                        </span>
                                                    </div>

                                                    <div className="bg-[#121A2E]/90 px-3.5 py-1 rounded-full text-[11px] text-[#8B99B0] border border-white/10">
                                                        Capturing automatically in 3s &bull; hold steady
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            {!regCameraOn ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-white/10 bg-[#1B253B]/40 hover:bg-[#24304A] text-[#ECF0F7] text-xs h-9 rounded-xl transition-colors"
                                                    onClick={startRegCamera}
                                                >
                                                    <Camera className="mr-1.5 size-3.5 text-[#7C8FFF]" /> Open Camera
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-white/10 bg-[#1B253B]/40 hover:bg-[#24304A] text-[#ECF0F7] text-xs h-9 rounded-xl transition-colors"
                                                    onClick={stopRegCamera}
                                                >
                                                    Stop Camera
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                disabled={!regCameraOn || isAutoCapturing}
                                                className="bg-[#212C4A] hover:bg-[#2a3860] text-[#ECF0F7] text-xs h-9 rounded-xl border border-white/10 transition-colors"
                                                onClick={captureRegAngle}
                                            >
                                                <Camera className="mr-1.5 size-3.5 text-[#7C8FFF]" /> Manual Snap ({REG_ANGLES[regActiveAngle]})
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {REG_ANGLES.map((angle, index) => (
                                                <button
                                                    key={angle}
                                                    type="button"
                                                    className={`relative block aspect-square w-full rounded-xl overflow-hidden border transition-all ${
                                                        regActiveAngle === index
                                                            ? "border-[#7C8FFF] ring-2 ring-[#5B6CF0]/50"
                                                            : "border-white/10 hover:border-white/25"
                                                    } bg-[#10192B]`}
                                                    onClick={() => setRegActiveAngle(index)}
                                                >
                                                    {regCaptures[index] ? (
                                                        <Image src={regCaptures[index]!.url} alt={angle} fill unoptimized sizes="80px" className="object-cover" />
                                                    ) : (
                                                        <ScanFace className="absolute inset-0 m-auto size-5 text-[#5A6882]" />
                                                    )}
                                                    {regCaptures[index] && (
                                                        <Check className="absolute right-1 top-1 size-3.5 rounded-full bg-[#34D399] p-0.5 text-[#0A0F1E] font-bold" />
                                                    )}
                                                    <span className="absolute bottom-0 inset-x-0 bg-[#0A0F1E]/85 text-[9px] font-medium text-center text-[#AEB9CC] py-0.5 truncate px-1 border-t border-white/5">
                                                        {index + 1}. {angle}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            isRegBusy ||
                                            !registrationName.trim() ||
                                            !registrationEmail.trim() ||
                                            registrationPassword.length < 6 ||
                                            registrationPassword !== registrationConfirmPassword ||
                                            regCaptures.some((c) => !c)
                                        }
                                        className="w-full h-12 bg-[#5B6CF0] hover:bg-[#4F5FE0] text-white font-bold text-sm border-0 transition-all hover:scale-[1.01] active:scale-[0.99] hover:shadow-[0_15px_30px_-5px_rgba(91,108,240,0.5)] flex items-center justify-center gap-3 group/btn rounded-[1.25rem] mt-2"
                                    >
                                        {isRegBusy ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Enrolling Identity Protocol...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Create Account ({regCaptures.filter(Boolean).length}/6 Angles)</span>
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center text-xs text-[#8B99B0] pt-2">
                                    Already enrolled in the system?{" "}
                                    <button
                                        type="button"
                                        onClick={() => handleTabChange("signin")}
                                        className="text-[#7C8FFF] font-semibold hover:underline ml-1"
                                    >
                                        Sign in to your account
                                    </button>
                                </div>
                            </div>
                        )}
                    </FadeIn>
                </div>
            </div>
        </PageTransition>
    );
}

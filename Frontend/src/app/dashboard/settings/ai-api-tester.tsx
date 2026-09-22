"use client";

import { useState } from "react";
import { Zap, Play, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, Clock, Hash } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";

interface TestResult {
    success: boolean;
    response?: string;
    model?: string;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    error?: string;
}

const QUICK_PROMPTS = [
    { label: "Connection Test", prompt: "Reply with exactly: API OK" },
    { label: "JSON Test", prompt: 'Reply with a JSON object: { "status": "ok", "model": "<your model name>" }' },
    { label: "Vietnamese", prompt: "Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t: Há»‡ thá»‘ng AI Ä‘ang hoáº¡t Ä‘á»™ng tá»‘t." },
];

export function AiApiTester() {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState(QUICK_PROMPTS[0].prompt);
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);

    async function runTest() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            setResult({ success: false, error: e instanceof Error ? e.message : "Network error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/[0.06] bg-card overflow-hidden shadow-xl shadow-black/20">
            {/* Header - always visible */}
            <SharedDashboardButton
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-success/10 to-primary/5 border-b border-white/[0.04] hover:from-success/15 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "color-mix(in srgb, var(--success) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 19%, transparent)" }}>
                        <Zap className="w-4 h-4 text-success" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-sm font-bold text-success tracking-wide">API Connection Tester</h2>
                        <p className="text-[11px] text-muted-foreground">Send a test prompt to verify your AI configuration</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </SharedDashboardButton>

            {isOpen && (
                <div className="px-5 py-5 flex flex-col gap-4">
                    {/* Quick prompt pills */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((q) => (
                            <SharedDashboardButton
                                key={q.label}
                                onClick={() => setPrompt(q.prompt)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                    prompt === q.prompt
                                        ? "bg-primary/20 border-border/40 text-primary"
                                        : "bg-muted border-border/15 text-muted-foreground hover:border-border/30 hover:text-muted-foreground"
                                }`}
                            >
                                {q.label}
                            </SharedDashboardButton>
                        ))}
                    </div>

                    {/* Prompt input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl px-4 py-3 text-sm font-mono text-foreground bg-background/60 border border-border/15 outline-none resize-none focus:border-border/50 focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/50"
                            placeholder="Enter a test prompt..."
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <SharedDashboardButton
                            onClick={runTest}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-success/15 text-success border border-border/30 hover:bg-success/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            {loading ? "Running..." : "Run Test"}
                        </SharedDashboardButton>
                        {result && (
                            <SharedDashboardButton
                                onClick={() => setResult(null)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-muted-foreground border border-transparent hover:border-border/15 transition-all cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" /> Clear
                            </SharedDashboardButton>
                        )}
                    </div>

                    {/* Result panel */}
                    {result && (
                        <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
                            result.success
                                ? "bg-success/[0.04] border-border/20"
                                : "bg-danger/[0.04] border-border/20"
                        }`}>
                            {/* Status row */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    {result.success
                                        ? <CheckCircle2 className="w-4 h-4 text-success" />
                                        : <XCircle className="w-4 h-4 text-danger" />}
                                    <span className={`text-sm font-semibold ${result.success ? "text-success" : "text-danger"}`}>
                                        {result.success ? "Success" : "Failed"}
                                    </span>
                                    {result.model && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-border/20">
                                            {result.model}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                    {result.latencyMs !== undefined && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {result.latencyMs}ms
                                        </span>
                                    )}
                                    {result.success && result.tokensIn !== undefined && (
                                        <span className="flex items-center gap-1">
                                            <Hash className="w-3 h-3" /> {result.tokensIn}↑ {result.tokensOut}↓
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Response or error */}
                            <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed p-3 rounded-lg ${
                                result.success
                                    ? "bg-background/60 text-primary"
                                    : "bg-danger/[0.06] text-danger"
                            }`}>
                                {result.success ? result.response : result.error}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

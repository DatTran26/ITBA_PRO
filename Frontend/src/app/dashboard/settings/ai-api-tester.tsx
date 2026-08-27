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
        <div className="rounded-2xl border border-white/[0.06] bg-[#131D30] overflow-hidden shadow-xl shadow-black/20">
            {/* Header - always visible */}
            <SharedDashboardButton
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#36DDAB]/10 to-[#7C8FFF]/5 border-b border-white/[0.04] hover:from-[#36DDAB]/15 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: "#36DDAB18", border: "1px solid #36DDAB30" }}>
                        <Zap className="w-4 h-4 text-[#36DDAB]" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-sm font-bold text-[#36DDAB] tracking-wide">API Connection Tester</h2>
                        <p className="text-[11px] text-[#5A6882]">Send a test prompt to verify your AI configuration</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#5A6882]" /> : <ChevronDown className="w-4 h-4 text-[#5A6882]" />}
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
                                        ? "bg-[#7C8FFF]/20 border-[#7C8FFF]/40 text-[#A9B4FF]"
                                        : "bg-[#1E2840] border-[#8B99B0]/15 text-[#5A6882] hover:border-[#7C8FFF]/30 hover:text-[#8B99B0]"
                                }`}
                            >
                                {q.label}
                            </SharedDashboardButton>
                        ))}
                    </div>

                    {/* Prompt input */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#8B99B0] uppercase tracking-wider">Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl px-4 py-3 text-sm font-mono text-[#ECF0F7] bg-[#0C1220]/60 border border-[#8B99B0]/15 outline-none resize-none focus:border-[#7C8FFF]/50 focus:ring-2 focus:ring-[#7C8FFF]/15 transition-all placeholder:text-[#5A6882]/50"
                            placeholder="Enter a test prompt..."
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <SharedDashboardButton
                            onClick={runTest}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#36DDAB]/15 text-[#36DDAB] border border-[#36DDAB]/30 hover:bg-[#36DDAB]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            {loading ? "Running..." : "Run Test"}
                        </SharedDashboardButton>
                        {result && (
                            <SharedDashboardButton
                                onClick={() => setResult(null)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-[#5A6882] hover:text-[#8B99B0] border border-transparent hover:border-[#8B99B0]/15 transition-all cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" /> Clear
                            </SharedDashboardButton>
                        )}
                    </div>

                    {/* Result panel */}
                    {result && (
                        <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
                            result.success
                                ? "bg-[#36DDAB]/[0.04] border-[#36DDAB]/20"
                                : "bg-[#FF6B82]/[0.04] border-[#FF6B82]/20"
                        }`}>
                            {/* Status row */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    {result.success
                                        ? <CheckCircle2 className="w-4 h-4 text-[#36DDAB]" />
                                        : <XCircle className="w-4 h-4 text-[#FF6B82]" />}
                                    <span className={`text-sm font-semibold ${result.success ? "text-[#36DDAB]" : "text-[#FF6B82]"}`}>
                                        {result.success ? "Success" : "Failed"}
                                    </span>
                                    {result.model && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#7C8FFF]/10 text-[#A9B4FF] border border-[#7C8FFF]/20">
                                            {result.model}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-[#5A6882]">
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
                                    ? "bg-[#0C1220]/60 text-[#D4DBE8]"
                                    : "bg-[#FF6B82]/[0.06] text-[#FF9BAB]"
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

"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Clock, Hash, Zap, ChevronDown } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const QUICK_PROMPTS = [
    { label: "Connection", prompt: "Reply with exactly: API OK" },
    { label: "JSON", prompt: 'Reply with JSON: { "status": "ok", "model": "<your model name>" }' },
    { label: "Vietnamese", prompt: "Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t: Há»‡ thá»‘ng AI Ä‘ang hoáº¡t Ä‘á»™ng tá»‘t." },
];

const MODEL_OPTIONS = ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gemini-2.0-flash"];

interface TestResult {
    success: boolean;
    response?: string;
    model?: string;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    error?: string;
}

export function AiApiTesterModal() {
    const [prompt, setPrompt] = useState(QUICK_PROMPTS[0].prompt);
    const [model, setModel] = useState("");
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(false);

    async function runTest() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
            });
            setResult(await res.json());
        } catch (e) {
            setResult({ success: false, error: e instanceof Error ? e.message : "Network error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <SharedDashboardButton
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#36DDAB]/10 text-[#36DDAB] border border-[#36DDAB]/30 hover:bg-[#36DDAB]/20 transition-all cursor-pointer"
                >
                    <Zap className="w-3 h-3" /> Test API
                </SharedDashboardButton>
            </DialogTrigger>

            <DialogContent
                className="!max-w-none w-[92vw] max-w-[960px] sm:max-w-[960px] bg-[#0F1829] border border-white/[0.08] text-[#ECF0F7] p-0 overflow-hidden gap-0"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#36DDAB]/8 to-[#7C8FFF]/4 border-b border-white/[0.06]">
                    <DialogTitle className="flex items-center gap-2.5 text-[15px] font-bold text-[#ECF0F7]">
                        <div className="w-7 h-7 rounded-lg bg-[#36DDAB]/15 border border-[#36DDAB]/25 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-[#36DDAB]" />
                        </div>
                        AI API Tester
                        <span className="text-[11px] font-normal text-[#5A6882] ml-1">Send a prompt to verify your configured key and model</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Two-column body */}
                <div className="grid grid-cols-[1fr_1.2fr] min-h-[460px]">

                    {/* LEFT - Result */}
                    <div className="flex flex-col gap-4 p-6 border-r border-white/[0.06]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6882]">Result</p>

                        {!result && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#5A6882]">
                                <div className="w-12 h-12 rounded-2xl bg-[#1E2840] flex items-center justify-center">
                                    <Zap className="w-5 h-5 opacity-30" />
                                </div>
                                <p className="text-sm text-center leading-relaxed">
                                    Run a test to see<br />the response here
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#7C8FFF]">
                                <Loader2 className="w-7 h-7 animate-spin opacity-60" />
                                <p className="text-sm">Calling API...</p>
                            </div>
                        )}

                        {result && (
                            <div className="flex flex-col gap-3 flex-1">
                                {/* Status bar */}
                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                                    result.success
                                        ? "bg-[#36DDAB]/[0.07] border-[#36DDAB]/20"
                                        : "bg-[#FF6B82]/[0.07] border-[#FF6B82]/20"
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {result.success
                                            ? <CheckCircle2 className="w-4 h-4 text-[#36DDAB]" />
                                            : <XCircle className="w-4 h-4 text-[#FF6B82]" />}
                                        <span className={`text-sm font-semibold ${result.success ? "text-[#36DDAB]" : "text-[#FF6B82]"}`}>
                                            {result.success ? "Success" : "Failed"}
                                        </span>
                                    </div>
                                    {result.latencyMs !== undefined && (
                                        <span className="flex items-center gap-1 text-[11px] text-[#5A6882]">
                                            <Clock className="w-3 h-3" /> {result.latencyMs}ms
                                        </span>
                                    )}
                                </div>

                                {/* Model + tokens row */}
                                {result.success && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {result.model && (
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#7C8FFF]/10 text-[#A9B4FF] border border-[#7C8FFF]/20">
                                                {result.model}
                                            </span>
                                        )}
                                        {result.tokensIn !== undefined && (
                                            <span className="flex items-center gap-1 text-[11px] text-[#5A6882]">
                                                <Hash className="w-3 h-3" />
                                                <span className="text-[#8B99B0]">{result.tokensIn}</span> in /
                                                <span className="text-[#8B99B0]">{result.tokensOut}</span> out
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Response */}
                                <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed p-3.5 rounded-xl flex-1 overflow-y-auto max-h-64 ${
                                    result.success
                                        ? "bg-[#0C1220] text-[#C8D3E6] border border-white/[0.04]"
                                        : "bg-[#FF6B82]/[0.05] text-[#FF9BAB] border border-[#FF6B82]/15"
                                }`}>
                                    {result.success ? result.response : result.error}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* RIGHT - Prompt */}
                    <div className="flex flex-col gap-4 p-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A6882]">Prompt</p>

                        {/* Model override */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[#8B99B0]">
                                Model <span className="text-[#5A6882] font-normal">- blank uses DB-configured model</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full h-9 appearance-none rounded-lg px-3 pr-8 text-sm text-[#ECF0F7] bg-[#0C1220] border border-[#8B99B0]/15 outline-none focus:border-[#7C8FFF]/40 focus:ring-1 focus:ring-[#7C8FFF]/20 transition-all cursor-pointer"
                                >
                                    <option value="">- Use configured model -</option>
                                    {MODEL_OPTIONS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A6882] pointer-events-none" />
                            </div>
                        </div>

                        {/* Quick prompts */}
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_PROMPTS.map((q) => (
                                <SharedDashboardButton
                                    key={q.label}
                                    type="button"
                                    onClick={() => setPrompt(q.prompt)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                        prompt === q.prompt
                                            ? "bg-[#7C8FFF]/15 border-[#7C8FFF]/35 text-[#A9B4FF]"
                                            : "bg-[#1A2438] border-[#8B99B0]/12 text-[#5A6882] hover:border-[#7C8FFF]/25 hover:text-[#8B99B0]"
                                    }`}
                                >
                                    {q.label}
                                </SharedDashboardButton>
                            ))}
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={7}
                            className="flex-1 w-full rounded-xl px-4 py-3 text-sm font-mono text-[#ECF0F7] bg-[#0C1220] border border-[#8B99B0]/15 outline-none resize-none focus:border-[#7C8FFF]/40 focus:ring-1 focus:ring-[#7C8FFF]/20 transition-all placeholder:text-[#5A6882]/40"
                            placeholder="Enter a test prompt..."
                        />

                        {/* Run button */}
                        <SharedDashboardButton
                            type="button"
                            onClick={runTest}
                            disabled={loading || !prompt.trim()}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#36DDAB]/20 to-[#36DDAB]/10 text-[#36DDAB] border border-[#36DDAB]/30 hover:from-[#36DDAB]/30 hover:to-[#36DDAB]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#36DDAB]/5"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {loading ? "Running..." : "Run Test"}
                        </SharedDashboardButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

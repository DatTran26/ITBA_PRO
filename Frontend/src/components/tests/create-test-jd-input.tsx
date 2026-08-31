"use client";

import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/ui/motion-wrapper";

interface Props {
    jobDescription: string;
    setJobDescription: (v: string) => void;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

// "Input Job Description" column of the create-test workbench (textarea + AI auto-detect).
// Split out of create-test-workbench.tsx.
export default function CreateTestJdInput({ jobDescription, setJobDescription, isAnalyzing, onAnalyze }: Props) {
    return (
        <FadeIn delay={0.1}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C8FFF]/10 border border-[#7C8FFF]/20 flex items-center justify-center text-[#7C8FFF] shadow-[0_0_15px_rgba(124,143,255,0.1)]">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-medium font-display text-white">Input Job Description</h2>
                </div>
            </div>

            <p className="text-sm text-[#8B99B0] mb-4 h-[40px]">
                Paste a Job Description. AI will auto-detect the optimal role and grade parameters.
            </p>

            <div className="space-y-4">
                <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter job responsibilities, requirements, and tech stack here..."
                    className="min-h-[280px] max-h-[280px] overflow-y-auto bg-[#1B253B]/40 border-white/5 hover:border-[#7C8FFF]/30 focus-visible:ring-[#7C8FFF]/20 focus-visible:border-[#7C8FFF]/40 resize-none font-mono text-sm text-[#ECF0F7]/90 placeholder:text-[#5A6882] transition-all rounded-2xl backdrop-blur-md shadow-inner custom-scrollbar"
                />
                <Button
                    onClick={onAnalyze}
                    disabled={!jobDescription.trim() || isAnalyzing}
                    className="w-full bg-gradient-to-r from-[#7C8FFF]/20 to-[#5B6CF0]/20 text-[#ECF0F7] hover:from-[#7C8FFF]/30 hover:to-[#5B6CF0]/30 border border-[#7C8FFF]/30 rounded-2xl h-12 transition-all duration-300 group shadow-lg shadow-black/20"
                >
                    {isAnalyzing ? (
                        <>
                            <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mr-2" />
                            Analyzing Schema...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                            Auto-Detect Parameters
                        </>
                    )}
                </Button>
            </div>
        </FadeIn>
    );
}

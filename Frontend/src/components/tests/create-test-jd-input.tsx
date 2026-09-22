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
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-border/20 flex items-center justify-center text-primary shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_10%,transparent)]">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-medium font-display text-foreground">Input Job Description</h2>
                </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 h-[40px]">
                Paste a Job Description. AI will auto-detect the optimal role and grade parameters.
            </p>

            <div className="space-y-4">
                <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter job responsibilities, requirements, and tech stack here..."
                    className="min-h-[280px] max-h-[280px] overflow-y-auto bg-muted/40 border-border hover:border-border/30 focus-visible:ring-primary/20 focus-visible:border-border/40 resize-none font-mono text-sm text-foreground/90 placeholder:text-muted-foreground transition-all rounded-2xl backdrop-blur-md shadow-inner custom-scrollbar"
                />
                <Button
                    onClick={onAnalyze}
                    disabled={!jobDescription.trim() || isAnalyzing}
                    className="w-full bg-gradient-to-r from-primary/20 to-primary/20 text-foreground hover:from-primary/30 hover:to-primary/30 border border-border/30 rounded-2xl h-12 transition-all duration-300 group shadow-lg shadow-black/20"
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

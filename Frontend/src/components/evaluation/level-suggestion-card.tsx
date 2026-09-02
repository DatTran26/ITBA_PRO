"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { LevelSuggestion } from "@/app/dashboard/results/[id]/evaluation-types";

interface LevelSuggestionCardProps {
    resultId: string;
    positionId: string;
    personId: string | null;
}

export default function LevelSuggestionCard({ resultId, positionId, personId }: LevelSuggestionCardProps) {
    const [suggestion, setSuggestion] = useState<LevelSuggestion | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [seniorConfirmed, setSeniorConfirmed] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const isSenior = suggestion?.suggested_level?.toLowerCase().includes("senior") ?? false;

    async function handleRequest() {
        setIsLoading(true);
        setSuggestion(null);
        setSeniorConfirmed(false);
        try {
            const res = await fetch("/api/ai/evaluate-level", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ result_id: resultId, position_id: positionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to get suggestion");
            setSuggestion(data);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "AI suggestion failed");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAcceptLevel() {
        if (!suggestion || !personId) return;
        if (isSenior && !seniorConfirmed) {
            toast.error("Please confirm senior designation first");
            return;
        }
        setIsAccepting(true);
        try {
            const res = await fetch(`/api/persons/${personId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_level: suggestion.suggested_level }),
            });
            if (!res.ok) throw new Error("Failed to update level");
            toast.success(`Level updated to ${suggestion.suggested_level}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Update failed");
        } finally {
            setIsAccepting(false);
        }
    }

    return (
        <Card className="border-[#8B99B0]/10 bg-[#151D2E] mt-4">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <h4 className="font-medium text-[#ECF0F7]">AI Level Suggestion</h4>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleRequest}
                        disabled={isLoading}
                        className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 h-8 px-4 rounded-lg cursor-pointer"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                        {suggestion ? "Re-evaluate" : "Request"}
                    </Button>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-8 text-[#5A6882]">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm">Analyzing evaluation data...</span>
                    </div>
                )}

                {suggestion && !isLoading && (
                    <div className="space-y-4">
                        {/* Result */}
                        <div className="flex items-center gap-3">
                            <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/25 text-sm px-3 py-1">
                                {suggestion.suggested_level}
                            </Badge>
                            <span className="text-sm text-[#8B99B0]">
                                Confidence: <span className="text-[#ECF0F7] font-medium">{suggestion.confidence}%</span>
                            </span>
                        </div>

                        {/* Reasoning */}
                        <p className="text-sm text-[#8B99B0] leading-relaxed">{suggestion.reasoning}</p>

                        {/* Skill Gaps */}
                        {suggestion.skill_gaps.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-[#5A6882] uppercase tracking-wider mb-2">Skill Gaps</p>
                                <div className="space-y-1.5">
                                    {suggestion.skill_gaps.map((gap) => (
                                        <div key={gap.skill} className="flex items-center gap-2 text-sm">
                                            <span className="text-[#8B99B0]">{gap.skill}:</span>
                                            <span className="text-rose-400">{gap.current}</span>
                                            <span className="text-[#5A6882]">/</span>
                                            <span className="text-emerald-400">{gap.required}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* BR-03 Warning */}
                        {isSenior && (
                            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.05]">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-400">BR-03: Senior level requires human confirmation</p>
                                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={seniorConfirmed}
                                                onChange={(e) => setSeniorConfirmed(e.target.checked)}
                                                className="rounded border-amber-500/40 bg-transparent text-amber-500 focus:ring-amber-500/30"
                                            />
                                            <span className="text-xs text-[#8B99B0]">I confirm this senior designation after review</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Accept */}
                        {personId && (
                            <Button
                                size="sm"
                                onClick={handleAcceptLevel}
                                disabled={isAccepting || (isSenior && !seniorConfirmed)}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 h-8 px-4 rounded-lg cursor-pointer disabled:opacity-40"
                            >
                                {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                                Accept Level
                            </Button>
                        )}
                    </div>
                )}

                {!suggestion && !isLoading && (
                    <p className="text-sm text-[#5A6882] py-4 text-center">
                        Click &ldquo;Request&rdquo; to get an AI-powered level suggestion based on evaluation scores.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

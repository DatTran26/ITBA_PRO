"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
                Không bắt buộc — dán JD để AI tự chọn vai trò và cấp độ bên cạnh.
            </p>
            <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Dán trách nhiệm, yêu cầu và tech stack của vị trí..."
                className="h-[300px] resize-none overflow-y-auto rounded-xl bg-card text-sm leading-relaxed"
            />
            <Button
                variant="outline"
                onClick={onAnalyze}
                disabled={!jobDescription.trim() || isAnalyzing}
                className="h-10 w-full gap-2"
            >
                {isAnalyzing ? (
                    <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        Đang phân tích JD...
                    </>
                ) : (
                    <>
                        <Sparkles className="text-primary" />
                        Tự nhận diện vai trò & cấp độ
                    </>
                )}
            </Button>
        </div>
    );
}

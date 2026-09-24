"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { useState } from "react";
import type { DashboardTest } from "@/app/dashboard/types";
import AssessmentCardHeader from "./assessment-card-header";
import AssessmentCardMetrics from "./assessment-card-metrics";

interface Props {
    test: DashboardTest;
    onToggleStatus: (test: { id: string; status: string; name: string }) => void;
    onDelete?: (test: { id: string; name: string }) => void;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    selectionMode?: boolean;
}

export default function AssessmentCard({ test, onToggleStatus, onDelete, isSelected = false, onSelect, selectionMode = false }: Props) {
    const router = useRouter();
    const [isCardHovered, setIsCardHovered] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onHoverStart={() => setIsCardHovered(true)}
            onHoverEnd={() => setIsCardHovered(false)}
            className="relative group/outer"
        >
            <Card
                onClick={() => selectionMode ? onSelect?.(test.id, !isSelected) : router.push(`/dashboard/tests/${test.id}`)}
                className={`group border-muted-foreground/15 bg-muted/40 backdrop-blur-2xl hover:bg-warning/5 hover:border-warning/40 cursor-pointer transition-all duration-700 overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.2rem] ${
                    isSelected ? "ring-2 ring-warning/60 bg-muted/90 border-warning/50 shadow-[0_0_30px_color-mix(in_srgb,var(--warning)_20%,transparent)]" : ""
                }`}
            >
                {/* Visual Glass Accent - Inner Reflective Border */}
                <div className="absolute inset-px rounded-[2.1rem] border border-border pointer-events-none z-10" />
                <div className="absolute inset-[2px] rounded-[2rem] border border-border pointer-events-none z-10" />

                {/* Top Radiant Accent */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[3px] bg-gradient-to-r from-transparent via-warning/80 to-transparent transition-all duration-700 blur-[2px] ${
                    isSelected || isCardHovered ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`} />

                {/* Selection Overlay */}
                {selectionMode && (
                    <div className="absolute top-6 left-6 z-30">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelect?.(test.id, !!checked)}
                            className="data-[checked=true]:bg-warning data-[checked=true]:border-warning border-muted-foreground/20 w-6 h-6 rounded-lg transition-transform active:scale-90"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                <AssessmentCardHeader
                    test={test}
                    isCardHovered={isCardHovered}
                    isSelected={isSelected}
                    selectionMode={selectionMode}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                />

                <AssessmentCardMetrics test={test} />
            </Card>
        </motion.div>
    );
}

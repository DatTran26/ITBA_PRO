"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2, CheckCircle2, Power, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

function BulkActionButton({ icon: Icon, label, color, bgColor, onClick, disabled }: {
    icon: any;
    label: string;
    color: string;
    bgColor: string;
    onClick: () => void;
    disabled: boolean;
}) {
    return (
        <Button
            size="sm"
            disabled={disabled}
            onClick={onClick}
            className={`h-9 rounded-xl px-4 gap-2 font-bold transition-all ${bgColor} ${color} border border-transparent hover:border-current/20 disabled:opacity-30 disabled:pointer-events-none`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </Button>
    );
}

interface Props {
    selectionMode: boolean;
    selectedCount: number;
    filteredCount: number;
    isBulkActing: boolean;
    onToggleSelectAll: () => void;
    onBulkAction: (action: "activate" | "deactivate" | "delete") => void;
    onClose: () => void;
}

// Floating bulk-actions bar of the assessment grid. Split out of assessment-grid.tsx.
export default function AssessmentGridBulkBar({
    selectionMode,
    selectedCount,
    filteredCount,
    isBulkActing,
    onToggleSelectAll,
    onBulkAction,
    onClose,
}: Props) {
    return (
        <AnimatePresence>
            {selectionMode && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                >
                    <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-[#7C8FFF]/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-5 ml-2">
                            <Checkbox
                                checked={selectedCount === filteredCount && filteredCount > 0}
                                onCheckedChange={onToggleSelectAll}
                                className="data-[checked=true]:bg-[#7C8FFF] data-[checked=true]:border-[#7C8FFF] border-[#8B99B0]/30 w-5 h-5 rounded-lg"
                            />
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-[#ECF0F7]">{selectedCount} Selected</span>
                                <span className="text-[10px] text-[#7C8FFF] font-bold uppercase tracking-widest">Active Operations</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-[#1B253B]/50 p-1.5 rounded-2xl border border-[#8B99B0]/5">
                                <BulkActionButton
                                    icon={CheckCircle2}
                                    label="Live"
                                    color="text-emerald-400"
                                    bgColor="bg-emerald-500/10"
                                    disabled={isBulkActing || selectedCount === 0}
                                    onClick={() => onBulkAction('activate')}
                                />
                                <BulkActionButton
                                    icon={Power}
                                    label="Deactivate"
                                    color="text-amber-400"
                                    bgColor="bg-amber-500/10"
                                    disabled={isBulkActing || selectedCount === 0}
                                    onClick={() => onBulkAction('deactivate')}
                                />
                                <div className="w-px h-6 bg-[#8B99B0]/10 mx-1" />
                                <BulkActionButton
                                    icon={Trash2}
                                    label="Delete"
                                    color="text-rose-400"
                                    bgColor="bg-rose-500/10 hover:bg-rose-500/20"
                                    disabled={isBulkActing || selectedCount === 0}
                                    onClick={() => onBulkAction('delete')}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-10 w-10 rounded-2xl hover:bg-rose-500/10 text-[#5A6882] hover:text-rose-400 border border-transparent hover:border-rose-400/20"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

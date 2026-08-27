"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion-wrapper";

// Zero-assessments empty state of the assessment grid. Split out of assessment-grid.tsx.
export default function AssessmentGridEmptyState() {
    return (
        <FadeIn delay={0.3}>
            <Card className="border-[#8B99B0]/10 bg-[#1B253B]/30 backdrop-blur-sm border-dashed rounded-[2.5rem]">
                <CardContent className="py-24 text-center flex flex-col items-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="w-20 h-20 rounded-3xl bg-[#0F172A] border border-[#8B99B0]/15 flex items-center justify-center mb-6 shadow-2xl"
                    >
                        <Database className="w-8 h-8 text-[#7C8FFF]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#ECF0F7] mb-3 font-display">Craft Your First Assessment</h3>
                    <p className="text-[#8B99B0] mb-8 max-w-sm text-base leading-relaxed">
                        Start your professional evaluation journey. Generate AI-powered tests or build your own custom flow.
                    </p>
                    <Link href="/dashboard/create">
                        <Button className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white rounded-2xl h-12 px-8 gap-2 font-bold shadow-[0_10px_20px_rgba(124,143,255,0.3)] transition-all hover:scale-105 active:scale-95">
                            <Plus className="w-5 h-5" /> Create Now
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </FadeIn>
    );
}

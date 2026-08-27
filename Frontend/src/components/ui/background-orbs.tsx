"use client";

import { useEffect, useState } from "react";

export default function BackgroundOrbs() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Mesh base */}
            <div className="absolute top-0 left-0 right-0 h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(91,108,240,0.18),transparent)]" />

            {/* Static Orbs — no animation needed, blur makes motion imperceptible */}
            <div
                className="absolute top-[5%] left-[5%] w-[650px] h-[650px] bg-[#8B5CF6]/[0.18] blur-[140px] rounded-full"
            />

            <div
                className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#3B82F6]/[0.15] blur-[130px] rounded-full"
            />

            <div
                className="absolute top-[35%] right-[25%] w-[450px] h-[450px] bg-[#EF4444]/[0.1] blur-[120px] rounded-full"
            />

            {/* Local noise texture — replaces external SVG dependency */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'url("/textures/noise-256x256.png")',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '256px 256px',
                }}
            />

            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
    );
}

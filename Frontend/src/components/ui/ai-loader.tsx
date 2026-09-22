"use client";

import { useEffect, useState } from "react";

const messages = [
    "Khởi tạo AI model...",
    "Phân tích yêu cầu vai trò...",
    "Xây dựng ngân hàng câu hỏi...",
    "Đánh giá độ khó...",
    "Hoàn thiện bài test...",
];

export function AILoader() {
    const [messageIndex, setMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const msgInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(msgInterval);
    }, []);

    useEffect(() => {
        const start = Date.now();
        const duration = 10000;
        const raf = requestAnimationFrame(function tick() {
            const elapsed = Date.now() - start;
            setProgress(Math.min(100, (elapsed / duration) * 100));
            if (elapsed < duration) requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-violet-500 rounded-xl opacity-20" />
                <div className="absolute inset-2 bg-indigo-500 rounded-xl opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center text-foreground font-bold text-xl">
                    AI
                </div>
            </div>

            <div className="h-6">
                <p className="text-muted-foreground text-sm font-medium">{messages[messageIndex]}</p>
            </div>

            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-none"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

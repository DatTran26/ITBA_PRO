"use client";

import { motion, AnimatePresence } from "framer-motion";
export { AnimatePresence };
import { ReactNode, useRef } from "react";
import {
    useMotionValue,
    useSpring,
    useTransform
} from "framer-motion";

export const FadeIn = ({
    children,
    delay = 0,
    className = "",
    noVertical = false
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
    noVertical?: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, y: noVertical ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
    >
        {children}
    </motion.div>
);


export const StaggerContainer = ({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string
}) => (
    <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                },
            },
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const StaggerItem = ({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string
}) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 15 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const PageTransition = ({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

export const TiltCard = ({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={className}
        >
            <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
                {children}
            </div>
        </motion.div>
    );
};

export const RevealText = ({
    text,
    className = ""
}: {
    text: string;
    className?: string
}) => {
    const words = text.split(" ");

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`flex flex-wrap ${className}`}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    variants={{
                        hidden: { opacity: 0, y: 20, rotate: 5 },
                        visible: {
                            opacity: 1,
                            y: 0,
                            rotate: 0,
                            transition: {
                                duration: 0.6,
                                delay: i * 0.1,
                                ease: [0.16, 1, 0.3, 1]
                            }
                        },
                    }}
                    className="inline-block mr-[0.25em] whitespace-nowrap"
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
};

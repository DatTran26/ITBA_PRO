import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        // Injected at build time — update watcher compares this to detect new deployments
        NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    },
    images: {
        formats: ["image/avif", "image/webp"],
    },
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "framer-motion",
            "@supabase/supabase-js",
        ],
    },
    poweredByHeader: false,
    output: "standalone",
    allowedDevOrigins: [
        "bunch-assessments-era-front.trycloudflare.com",
        "26.245.221.224",
        "127.0.0.1",
        "localhost",
    ],
};

export default nextConfig;

"use client";

import { usePathname } from "next/navigation";

/** Toàn bộ /dashboard dùng chủ đề sáng TopGo (.tg).
 *  Các route ngoài /dashboard (login, test công khai) giữ chủ đề .dark của <html>. */
const TG_ROUTES = [/^\/dashboard/];

export function useIsTopGoTheme() {
    const pathname = usePathname() || "";
    return TG_ROUTES.some((re) => re.test(pathname));
}

/** Bọc phần thân dashboard và gắn class chủ đề cho route đang mở. */
export default function ThemeScope({ children }: { children: React.ReactNode }) {
    const isTg = useIsTopGoTheme();
    return (
        <div className={isTg ? "tg min-h-screen" : "contents"} suppressHydrationWarning>
            {children}
        </div>
    );
}

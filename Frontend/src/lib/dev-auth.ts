import type { UserRole } from "@/components/ui/nav-config";

export const DEV_AUTH_COOKIE = "dt_dev_auth";
export const DEV_AUTH_COOKIE_VALUE = "super_admin";

export const DEV_AUTH_USER = {
    id: "local-dev-super-admin",
    authId: "local-dev-super-admin",
    name: "Test Super Admin",
    email: process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "test.superadmin@itba.ai",
    role: "super_admin" as UserRole,
};

export function isDevAuthEnabled() {
    // Avoid NODE_ENV — Turbopack can inline it as "production" even in `next dev`.
    return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
}

export function isLocalDevHost(hostname: string | null | undefined) {
    const host = (hostname ?? "").split(":")[0].toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

export function isDevAuthCookieValue(value?: string) {
    return !!parseDevAuthCookie(value);
}

export function parseDevAuthCookie(value?: string) {
    if (!isDevAuthEnabled()) return null;
    if (value === DEV_AUTH_COOKIE_VALUE) return DEV_AUTH_USER;
    if (!value?.startsWith("user.")) return null;

    try {
        const encoded = value.slice(5).replace(/-/g, "+").replace(/_/g, "/");
        const binary = atob(encoded);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const user = JSON.parse(new TextDecoder().decode(bytes));
        if (!user?.id || !user?.email || !user?.role) return null;
        return {
            id: String(user.id),
            authId: String(user.authId ?? user.id),
            name: String(user.name ?? user.email),
            email: String(user.email),
            role: user.role as UserRole,
        };
    } catch {
        return null;
    }
}

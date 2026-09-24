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

const KNOWN_FACE_LOGIN_HOSTS = new Set(["staging.wpcteam.shop", "production.wpcteam.shop"]);

function normalizeHostname(hostname: string | null | undefined) {
    const raw = (hostname ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
    if (!raw) return "";
    if (raw.startsWith("[")) {
        const end = raw.indexOf("]");
        if (end !== -1) return raw.slice(0, end + 1);
    }
    const [name, port] = raw.split(":");
    if (port !== undefined && raw.split(":").length === 2 && /^\d+$/.test(port)) {
        return name;
    }
    return raw;
}

export function isLocalDevHost(hostname: string | null | undefined) {
    const host = normalizeHostname(hostname);
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

function isComposeInternalHost(host: string) {
    return host === "web" || host.startsWith("itba-ocr-") || host.endsWith(".local");
}

export function resolveRequestHostname(request: {
    headers: { get(name: string): string | null };
    nextUrl: { hostname: string };
}) {
    const rawHost = request.headers.get("host") ?? request.nextUrl.hostname;
    const host = normalizeHostname(rawHost);
    if (KNOWN_FACE_LOGIN_HOSTS.has(host) || isLocalDevHost(host)) {
        return rawHost;
    }
    const forwardedRaw = request.headers.get("x-forwarded-host");
    if (forwardedRaw && isComposeInternalHost(host)) {
        return forwardedRaw;
    }
    return rawHost;
}

export function isFaceLoginHostAllowed(hostname: string | null | undefined) {
    const host = normalizeHostname(hostname);
    if (!host) return false;
    if (isLocalDevHost(host)) return true;
    if (KNOWN_FACE_LOGIN_HOSTS.has(host)) return true;
    if (process.env.FACE_LOGIN_ENABLED === "true") return true;

    const configured = [process.env.TRAEFIK_HOST, process.env.NEXT_PUBLIC_APP_URL];
    for (const value of configured) {
        if (!value) continue;
        try {
            const configuredHost = value.includes("://")
                ? new URL(value).hostname.toLowerCase()
                : normalizeHostname(value);
            if (configuredHost && configuredHost === host) return true;
        } catch {
            continue;
        }
    }
    return false;
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

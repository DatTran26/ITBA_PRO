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
    return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";
}

export function isDevAuthCookieValue(value?: string) {
    return isDevAuthEnabled() && value === DEV_AUTH_COOKIE_VALUE;
}

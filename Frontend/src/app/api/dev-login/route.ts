import { DEV_AUTH_COOKIE, DEV_AUTH_COOKIE_VALUE, isDevAuthEnabled } from "@/lib/dev-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

function accountsFilePath() {
    return process.env.DEV_LOGIN_ACCOUNTS_FILE ?? path.resolve(process.cwd(), "..", "..", "ITBA_Accounts.txt");
}

function sectionForCurrentSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    return url.includes("kxpunppvqfxfqdwpqpmp") ? "STAGING" : "PRODUCTION";
}

function findSuperAdminPassword(fileText: string, section: string, email: string) {
    const marker = section.toUpperCase();
    let inSection = false;

    for (const line of fileText.split(/\r?\n/)) {
        if (line.toUpperCase().startsWith(marker)) inSection = true;
        if (inSection && /^={8,}/.test(line)) break;
        if (!inSection || !line.toLowerCase().startsWith("super_admin")) continue;

        const parts = line.trim().split(/\s{2,}/);
        if (parts[2]?.toLowerCase() === email) return parts[3] ?? null;
    }

    return null;
}

export async function POST(request: NextRequest) {
    if (!isDevAuthEnabled() || !["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)) {
        return NextResponse.json({ error: "Dev login is disabled" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const expectedEmail = (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "test.superadmin@itba.ai").toLowerCase();
    if (email !== expectedEmail) {
        return NextResponse.json({ error: "Invalid local dev account" }, { status: 401 });
    }

    const fileText = await readFile(accountsFilePath(), "utf8");
    const expectedPassword = findSuperAdminPassword(fileText, sectionForCurrentSupabase(), expectedEmail);
    if (!expectedPassword || password !== expectedPassword) {
        return NextResponse.json({ error: "Invalid local dev password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(DEV_AUTH_COOKIE, DEV_AUTH_COOKIE_VALUE, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 8,
    });
    return response;
}

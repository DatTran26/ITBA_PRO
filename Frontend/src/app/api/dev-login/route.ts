import { DEV_AUTH_COOKIE, DEV_AUTH_COOKIE_VALUE, isDevAuthEnabled, isLocalDevHost } from "@/lib/dev-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

function accountsFilePath() {
    return process.env.DEV_LOGIN_ACCOUNTS_FILE ?? path.resolve(process.cwd(), "..", "..", "ITBA_Accounts.txt");
}

function findSuperAdminPasswords(fileText: string, email: string) {
    const passwords: string[] = [];

    for (const line of fileText.split(/\r?\n/)) {
        if (!line.toLowerCase().startsWith("super_admin")) continue;

        const parts = line.trim().split(/\s+/);
        const foundEmail = parts.find((part) => part.toLowerCase() === email);
        if (!foundEmail) continue;
        const password = parts[parts.length - 1];
        if (password) passwords.push(password);
    }

    return passwords;
}

export async function POST(request: NextRequest) {
    const host = request.headers.get("host") ?? request.nextUrl.hostname;
    if (!isDevAuthEnabled() || !isLocalDevHost(host)) {
        return NextResponse.json({ error: "Dev login is disabled" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    const expectedEmail = (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "test.superadmin@itba.ai").toLowerCase();
    if (email !== expectedEmail) {
        return NextResponse.json({ error: "Invalid local dev account" }, { status: 401 });
    }

    const fileText = await readFile(accountsFilePath(), "utf8");
    const expectedPasswords = findSuperAdminPasswords(fileText, expectedEmail);
    if (!expectedPasswords.includes(password)) {
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

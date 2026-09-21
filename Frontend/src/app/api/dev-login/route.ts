import { DEV_AUTH_COOKIE, DEV_AUTH_COOKIE_VALUE, isDevAuthEnabled } from "@/lib/dev-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

function accountsFileCandidates() {
    if (process.env.DEV_LOGIN_ACCOUNTS_FILE) return [process.env.DEV_LOGIN_ACCOUNTS_FILE];
    const cwd = process.cwd();
    return [
        path.resolve(cwd, "ITBA_Accounts.txt"),
        path.resolve(cwd, "..", "ITBA_Accounts.txt"),
        path.resolve(cwd, "..", "..", "ITBA_Accounts.txt"),
    ];
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
    if (!isDevAuthEnabled()) {
        return NextResponse.json({ error: "Dev login is disabled" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    const expectedEmail = (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "test.superadmin@itba.ai").toLowerCase();
    if (email !== expectedEmail) {
        return NextResponse.json({ error: "Invalid local dev account" }, { status: 401 });
    }

    const expectedPasswords = new Set<string>();
    const envPassword = process.env.DEV_LOGIN_PASSWORD?.trim();
    if (envPassword) expectedPasswords.add(envPassword);
    expectedPasswords.add("localdev");

    for (const filePath of accountsFileCandidates()) {
        try {
            const fileText = await readFile(filePath, "utf8");
            for (const found of findSuperAdminPasswords(fileText, expectedEmail)) {
                expectedPasswords.add(found);
            }
        } catch {
            // File is optional for local vision/Face ID work.
        }
    }

    if (!expectedPasswords.has(password)) {
        return NextResponse.json({
            error: "Use test.superadmin@itba.ai / localdev for local login (Supabase passwords are not used here).",
        }, { status: 401 });
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

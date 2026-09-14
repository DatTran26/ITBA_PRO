import { NextResponse } from "next/server";
import { DEV_AUTH_COOKIE } from "@/lib/dev-auth";

/**
 * Clears the dev auth cookie so logout works for dev/face-login sessions.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEV_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
  return response;
}

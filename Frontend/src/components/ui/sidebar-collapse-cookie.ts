import { cookies } from "next/headers";
import { SIDEBAR_COLLAPSED_COOKIE } from "./sidebar-collapse-cookie-name";

/**
 * Server-side read of the sidebar collapse preference. Returns false (expanded)
 * when the cookie is absent, so first-time users see an expanded sidebar.
 * Reading server-side avoids first-paint flash that localStorage would cause.
 *
 * Server-only by virtue of importing next/headers — accidental client import
 * will fail at build time. Cookie name lives in sidebar-collapse-cookie-name.ts
 * so client writers can import that constant without dragging next/headers in.
 */
export async function readSidebarCollapsed(): Promise<boolean> {
    const store = await cookies();
    return store.get(SIDEBAR_COLLAPSED_COOKIE)?.value === "1";
}

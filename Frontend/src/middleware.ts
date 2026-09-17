import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEV_AUTH_COOKIE, parseDevAuthCookie } from '@/lib/dev-auth'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const publicRoutes = ['/login', '/register', '/reset-password', '/test/']
    const isPublicRoute = pathname === '/' || publicRoutes.some(r => pathname.startsWith(r))
    const isApiRoute = pathname.startsWith('/api/')
    const hasDevAuth = !!parseDevAuthCookie(request.cookies.get(DEV_AUTH_COOKIE)?.value)
    if (hasDevAuth) {
        if (pathname === "/login" || pathname === "/register") {
            const url = request.nextUrl.clone()
            url.pathname = "/dashboard"
            return NextResponse.redirect(url)
        }
        return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If variables are missing, skip supabase auth and return 500 error page
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Middleware Error: Supabase variables are missing.')
        return new NextResponse('Internal Server Error: Supabase configuration missing', { status: 500 })
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Public routes that don't require authentication
    // Protect all non-public routes
    if (!user && !isPublicRoute && !isApiRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // For authenticated users: enforce routing rules
    if (user) {
        // All roles land on /dashboard after login — no role check needed
        if (pathname === "/login" || pathname === "/register") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }

        // HR can access /dashboard (exact), /dashboard/recruitment/*, /dashboard/profile
        // Only fetch role when the path is one HR should not be on (avoids DB call on normal navigation)
        const isBlockedForHr =
            pathname.startsWith("/dashboard") &&
            pathname !== "/dashboard" &&
            !pathname.startsWith("/dashboard/recruitment") &&
            !pathname.startsWith("/dashboard/profile") &&
            !pathname.startsWith("/dashboard/versions");

        if (isBlockedForHr) {
            const { data: roleData } = await supabase
                .from("users")
                .select("role")
                .eq("auth_id", user.id)
                .single();
            if (roleData?.role === "hr") {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Next.js 16.2 + Turbopack 404s App Router handlers if this proxy/middleware
        // matcher also runs on /api/*. Pages still go through auth below.
        '/((?!api|_next/static|_next/image|_next/data|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)',
    ],
}

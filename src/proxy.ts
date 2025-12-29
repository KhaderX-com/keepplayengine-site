import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
    const { pathname, origin } = request.nextUrl;
    const hostname = request.headers.get("host") || "";

    // Check if we're in development (localhost)
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

    // Check if this is the admin subdomain
    const isAdminSubdomain = hostname.startsWith("admin.");

    // If on admin subdomain OR accessing /admin routes in development
    if (isAdminSubdomain) {
        // Allow access to login page and auth API routes
        if (
            pathname === "/admin/login" ||
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/api/webauthn") ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static")
        ) {
            return NextResponse.next();
        }

        // Check authentication
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // If not authenticated, redirect to login
        if (!token) {
            const loginUrl = new URL("/admin/login", request.url);
            // Only set callbackUrl if not on root path
            if (pathname !== "/") {
                loginUrl.searchParams.set("callbackUrl", pathname);
            }
            return NextResponse.redirect(loginUrl);
        }

        // If authenticated and on root path, redirect to /admin dashboard
        if (pathname === "/") {
            return NextResponse.redirect(new URL("/admin", request.url));
        }

        // Verify user has admin role (ADMIN, SUPER_ADMIN, or MODERATOR)
        const userRole = token.role;
        if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "MODERATOR") {
            // Redirect unauthorized users to main site
            const mainSiteUrl = origin.replace("admin.", "");
            return NextResponse.redirect(new URL("/", mainSiteUrl));
        }

        // Add comprehensive security headers for admin panel
        const response = NextResponse.next();

        // Content Security Policy (Enhanced)
        response.headers.set(
            "Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https: blob:; " +
            "connect-src 'self' https://*.supabase.co https://public-pwa.vercel.app; " +
            "frame-ancestors 'none';"
        );

        // Security Headers
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
        );

        return response;
    }

    // Prevent non-admin users from accessing /admin routes on main domain
    // BUT allow it in development (localhost)
    if (pathname.startsWith("/admin") && !isAdminSubdomain && !isLocalhost) {
        // In production, redirect to admin subdomain
        const adminOrigin = origin.replace("://", "://admin.");
        const adminUrl = new URL(pathname, adminOrigin);
        return NextResponse.redirect(adminUrl);
    }

    // In development (localhost), handle /admin routes without subdomain
    if (isLocalhost && pathname.startsWith("/admin")) {
        // Allow access to login page and auth API routes
        if (
            pathname === "/admin/login" ||
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/api/webauthn") ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static")
        ) {
            return NextResponse.next();
        }

        // Check authentication for protected admin pages
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // If not authenticated, redirect to login
        if (!token) {
            const loginUrl = new URL("/admin/login", request.url);
            if (pathname !== "/admin/login") {
                loginUrl.searchParams.set("callbackUrl", pathname);
            }
            return NextResponse.redirect(loginUrl);
        }

        // Verify user has admin role
        const userRole = token.role;
        if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && userRole !== "MODERATOR") {
            // Redirect unauthorized users to home
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Add security headers for admin panel (even in dev)
        const response = NextResponse.next();
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public directory)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

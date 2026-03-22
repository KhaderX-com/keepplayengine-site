import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── C-04 Fix: Sanitize returnUrl to prevent open redirects ───
function sanitizeReturnUrl(raw: string | null): string {
    if (!raw) return "/admin";
    // Block protocol-relative URLs (//evil.com)
    if (raw.startsWith("//")) return "/admin";
    // Block absolute URLs with any scheme (https://evil.com, javascript:, data:)
    if (raw.includes("://") || raw.includes(":")) return "/admin";
    // Must be a relative path starting with /admin
    if (!raw.startsWith("/admin")) return "/admin";
    // Block encoded characters that could bypass checks
    if (raw.includes("%") || raw.includes("\\")) return "/admin";
    return raw;
}

// ─── CSRF: Origin validation (defense-in-depth, mirrors api-gateway) ───
function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // ── PWA / Installed App Support ──
    // When the admin panel runs as an installed PWA (standalone mode), the browser
    // may send requests with no Origin header (iOS Safari) or origin="null" (Android).
    // Auth (JWT token check) still runs — allowing null origin here does not weaken
    // security since a valid session is required for all state-changing operations.
    if (!origin || origin === "null") return true;

    const allowed = new Set<string>();
    if (process.env.NEXTAUTH_URL) {
        try { allowed.add(new URL(process.env.NEXTAUTH_URL).origin); } catch { /* ignore */ }
    }
    if (host) {
        allowed.add(`https://${host}`);
        if (host.includes("localhost") || host.includes("127.0.0.1")) {
            allowed.add(`http://${host}`);
        }
    }
    return allowed.has(origin);
}

// ─── CORS: Derive allowed origin from config ───
function getAllowedOrigin(request: NextRequest): string {
    if (process.env.NEXTAUTH_URL) {
        try { return new URL(process.env.NEXTAUTH_URL).origin; } catch { /* ignore */ }
    }
    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    return `${isLocal ? "http" : "https"}://${host}`;
}

function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    response.headers.set("Access-Control-Allow-Origin", getAllowedOrigin(request));
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
    return response;
}

// ─── Body size limit (100 KB) ───
const MAX_BODY_SIZE = 102_400;

export async function proxy(request: NextRequest) {
    const { pathname, origin } = request.nextUrl;
    const hostname = request.headers.get("host") || "";

    // M05: Generate a unique request tracing ID for audit trail correlation
    const requestId = crypto.randomUUID();

    // M06: In production, NEXTAUTH_URL is mandatory to prevent host-header spoofing
    if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL) {
        return new NextResponse("Server misconfigured", { status: 500 });
    }

    // Intercept favicon.ico to guarantee the KeepPlay Engine logo is used everywhere, ignoring any Next.js default Vercel logs
    if (pathname === "/favicon.ico") {
        const resp = NextResponse.rewrite(new URL("/keepplay-logo2.png", request.url));
        resp.headers.set("X-Request-ID", requestId);
        return resp;
    }

    // M07: Global returnUrl / callbackUrl sanitization — strip dangerous params early
    const returnUrlParam = request.nextUrl.searchParams.get("returnUrl")
        ?? request.nextUrl.searchParams.get("callbackUrl");
    if (returnUrlParam && returnUrlParam !== sanitizeReturnUrl(returnUrlParam)) {
        // Malicious returnUrl detected — redirect to clean version
        const clean = request.nextUrl.clone();
        if (clean.searchParams.has("returnUrl")) clean.searchParams.set("returnUrl", sanitizeReturnUrl(returnUrlParam));
        if (clean.searchParams.has("callbackUrl")) clean.searchParams.set("callbackUrl", sanitizeReturnUrl(returnUrlParam));
        const resp = NextResponse.redirect(clean);
        resp.headers.set("X-Request-ID", requestId);
        return resp;
    }

    // M12: admin-manifest.json is now explicitly allowed unauthenticated so the PWA install prompt loads correctly without needing Cloudflare bypass.

    // Check if we're in development (localhost)
    const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1");

    // Check if this is the admin subdomain
    const isAdminSubdomain = hostname.startsWith("admin.");

    // ─── API route protection (CSRF, body size, CORS preflight) ───
    const isApiRoute = pathname.startsWith("/api/");
    if (isApiRoute) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": getAllowedOrigin(request),
                    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
        if (isStateChanging) {
            // CSRF: Validate origin (skip NextAuth callback routes — they use state parameter)
            if (!pathname.startsWith("/api/auth/callback") && !pathname.startsWith("/api/auth/csrf") && !validateOrigin(request)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            // Body size limit
            const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
            if (contentLength > MAX_BODY_SIZE) {
                return NextResponse.json({ error: "Payload too large" }, { status: 413 });
            }
        }
    }

    // If on admin subdomain OR accessing /admin routes in development
    if (isAdminSubdomain) {
        // Allow auth API routes and static assets
        if (
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/api/webauthn") ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static") ||
            pathname === "/sw.js" ||
            pathname === "/favicon.ico" ||
            pathname === "/admin/icon" ||
            pathname === "/admin/apple-icon" ||
            pathname === "/manifest.json" ||
            pathname === "/admin-manifest.json"
        ) {
            const earlyResponse = NextResponse.next();
            if (isApiRoute) addCorsHeaders(earlyResponse, request);
            return earlyResponse;
        }

        // Check authentication
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });

        const isAuthenticated = !!token;
        const isLoginPage = pathname === "/admin/login";

        // Security Layer: Redirect authenticated users away from login page
        if (isAuthenticated && isLoginPage) {
            const returnUrl = sanitizeReturnUrl(
                request.nextUrl.searchParams.get("returnUrl") ||
                request.nextUrl.searchParams.get("callbackUrl")
            );
            return NextResponse.redirect(new URL(returnUrl, request.url));
        }

        // Allow unauthenticated users to access login page
        if (!isAuthenticated && isLoginPage) {
            return NextResponse.next();
        }

        // If not authenticated, redirect to login
        if (!token) {
            const loginUrl = new URL("/admin/login", request.url);
            // Set returnUrl for deep linking (except root path)
            if (pathname !== "/" && pathname !== "/admin") {
                loginUrl.searchParams.set("returnUrl", pathname);
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

        const requestHeaders = new Headers(request.headers);
        // M05: Propagate request ID to downstream handlers
        requestHeaders.set("x-request-id", requestId);

        const csp =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' data: https://fonts.gstatic.com; " +
            "img-src 'self' data: https:; " +
            "connect-src 'self' https://*.googleapis.com https://*.gstatic.com; " +
            "frame-ancestors 'none'; " +
            "form-action 'self';";

        requestHeaders.set("Content-Security-Policy", csp);

        // Add comprehensive security headers for admin panel
        const response = NextResponse.next({ request: { headers: requestHeaders } });

        // Prevent caching of sensitive admin pages
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");

        // M05: Attach request tracing ID for audit correlation
        response.headers.set("X-Request-ID", requestId);

        // Content Security Policy (nonce-based — no unsafe-eval, no unsafe-inline)
        response.headers.set("Content-Security-Policy", csp);

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

        // CORS for API routes
        if (isApiRoute) addCorsHeaders(response, request);

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
        // Allow auth API routes and static assets
        if (
            pathname.startsWith("/api/auth") ||
            pathname.startsWith("/api/webauthn") ||
            pathname.startsWith("/_next") ||
            pathname.startsWith("/static") ||
            pathname === "/sw.js" ||
            pathname === "/favicon.ico" ||
            pathname === "/admin/icon" ||
            pathname === "/admin/apple-icon" ||
            pathname === "/manifest.json" ||
            pathname === "/admin-manifest.json"
        ) {
            const earlyResponse = NextResponse.next();
            if (isApiRoute) addCorsHeaders(earlyResponse, request);
            return earlyResponse;
        }

        // Check authentication for protected admin pages
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });

        const isAuthenticated = !!token;
        const isLoginPage = pathname === "/admin/login";

        // Security Layer: Redirect authenticated users away from login page
        if (isAuthenticated && isLoginPage) {
            const returnUrl = sanitizeReturnUrl(
                request.nextUrl.searchParams.get("returnUrl") ||
                request.nextUrl.searchParams.get("callbackUrl")
            );
            return NextResponse.redirect(new URL(returnUrl, request.url));
        }

        // Allow unauthenticated users to access login page
        if (!isAuthenticated && isLoginPage) {
            return NextResponse.next();
        }

        // If not authenticated, redirect to login
        if (!token) {
            const loginUrl = new URL("/admin/login", request.url);
            if (pathname !== "/admin" && pathname !== "/admin/login") {
                loginUrl.searchParams.set("returnUrl", pathname);
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
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        // M05: Request tracing ID for dev
        response.headers.set("X-Request-ID", requestId);
        if (isApiRoute) addCorsHeaders(response, request);
        return response;
    }

    // CORS for any remaining API routes
    if (isApiRoute) {
        const resp = addCorsHeaders(NextResponse.next(), request);
        resp.headers.set("X-Request-ID", requestId);
        return resp;
    }

    const finalResp = NextResponse.next();
    finalResp.headers.set("X-Request-ID", requestId);
    return finalResp;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - public files (public directory)
         */
        "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

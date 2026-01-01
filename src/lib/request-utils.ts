import { NextRequest } from "next/server";

/**
 * Extract the real client IP address from request headers
 * Handles various proxy setups (Cloudflare, Vercel, nginx, etc.)
 * 
 * Priority order:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. True-Client-IP (Cloudflare Enterprise / Akamai)
 * 3. X-Real-IP (nginx)
 * 4. X-Forwarded-For (standard proxy header - takes first IP)
 * 5. X-Vercel-Forwarded-For (Vercel specific)
 * 6. Fallback to "unknown"
 */
export function getClientIP(request: NextRequest | Request): string {
    const headers = request.headers;

    // Cloudflare headers (most reliable when using Cloudflare)
    const cfConnectingIP = headers.get("cf-connecting-ip");
    if (cfConnectingIP && isValidIP(cfConnectingIP)) {
        return cfConnectingIP;
    }

    // True-Client-IP (Cloudflare Enterprise / Akamai)
    const trueClientIP = headers.get("true-client-ip");
    if (trueClientIP && isValidIP(trueClientIP)) {
        return trueClientIP;
    }

    // X-Real-IP (nginx)
    const xRealIP = headers.get("x-real-ip");
    if (xRealIP && isValidIP(xRealIP)) {
        return xRealIP;
    }

    // X-Forwarded-For (can contain multiple IPs, first is the client)
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
        const ips = xForwardedFor.split(",").map(ip => ip.trim());
        const clientIP = ips[0];
        if (clientIP && isValidIP(clientIP)) {
            return clientIP;
        }
    }

    // Vercel-specific header
    const vercelForwardedFor = headers.get("x-vercel-forwarded-for");
    if (vercelForwardedFor && isValidIP(vercelForwardedFor)) {
        return vercelForwardedFor;
    }

    return "unknown";
}

/**
 * Check if a string is a valid IP address (IPv4 or IPv6)
 * Filters out localhost/loopback addresses in production context
 */
function isValidIP(ip: string): boolean {
    if (!ip) return false;

    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    // Check for localhost/loopback - these are valid but not "real" client IPs
    const localhostValues = ["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"];
    if (localhostValues.includes(ip)) {
        // In development, localhost is fine. In production, we should skip it.
        // We return true but will continue checking other headers
        return process.env.NODE_ENV === "development";
    }

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get the full IP address, including localhost for development
 * Use this when you need the raw IP regardless of environment
 */
export function getRawClientIP(request: NextRequest | Request): string {
    const headers = request.headers;

    // Try all headers in order
    const possibleIPs = [
        headers.get("cf-connecting-ip"),
        headers.get("true-client-ip"),
        headers.get("x-real-ip"),
        headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        headers.get("x-vercel-forwarded-for"),
    ].filter(Boolean);

    // Return first non-empty IP or unknown
    return possibleIPs[0] || "unknown";
}

/**
 * Get detailed device info from User-Agent
 */
export function getDeviceInfo(userAgent: string | null): Record<string, unknown> {
    if (!userAgent) {
        return { raw: null };
    }

    const deviceInfo: Record<string, unknown> = {
        raw: userAgent,
    };

    // Detect OS
    if (userAgent.includes("Windows NT 10")) {
        deviceInfo.os = "Windows 10/11";
    } else if (userAgent.includes("Windows")) {
        deviceInfo.os = "Windows";
    } else if (userAgent.includes("Mac OS X")) {
        deviceInfo.os = "macOS";
    } else if (userAgent.includes("Linux")) {
        if (userAgent.includes("Android")) {
            deviceInfo.os = "Android";
        } else {
            deviceInfo.os = "Linux";
        }
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        deviceInfo.os = "iOS";
    }

    // Detect Browser
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
        deviceInfo.browser = "Chrome";
    } else if (userAgent.includes("Firefox")) {
        deviceInfo.browser = "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
        deviceInfo.browser = "Safari";
    } else if (userAgent.includes("Edg")) {
        deviceInfo.browser = "Edge";
    }

    // Detect Device Type
    if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
        deviceInfo.deviceType = "Mobile";
    } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
        deviceInfo.deviceType = "Tablet";
    } else {
        deviceInfo.deviceType = "Desktop";
    }

    return deviceInfo;
}

/**
 * Format IP address for display
 * Shows "Local Development" for localhost addresses
 */
export function formatIPForDisplay(ip: string): string {
    const localhostValues = ["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1", "unknown"];
    if (localhostValues.includes(ip)) {
        return process.env.NODE_ENV === "development" ? `${ip} (Local)` : ip;
    }
    return ip;
}

import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-gateway";
import bcrypt from "bcryptjs";
import { vaultPinSchema } from "@/lib/schemas";
import { sendSecurityAlert } from "@/lib/security-alerts";

/**
 * VAULT PIN VERIFICATION - 4TH SECURITY LAYER
 *
 * Bank-Level Security Implementation:
 * 1. PIN hash stored ONLY in environment variable (not in any database)
 * 2. Bcrypt with cost factor 14 (high computational cost)
 * 3. Constant-time comparison via bcrypt to prevent timing attacks
 * 4. In-memory rate limiting with progressive lockout
 * 5. IP-based tracking with automatic lockout escalation
 * 6. No logging of PIN attempts to any database (stealth mode)
 * 7. Memory-only state (resets on server restart for security)
 */

// In-memory security state (intentionally volatile - no persistence)
interface SecurityState {
    attempts: number;
    lastAttempt: number;
    lockoutUntil: number;
    lockoutLevel: number;
}

const securityStates = new Map<string, SecurityState>();

const MAX_ATTEMPTS_BEFORE_LOCKOUT = 3;
const BASE_LOCKOUT_DURATION = 5 * 60 * 1000;
const MAX_LOCKOUT_LEVEL = 5;
const ATTEMPT_WINDOW = 10 * 60 * 1000;

function cleanOldEntries() {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000;
    for (const [key, state] of securityStates.entries()) {
        if (now - state.lastAttempt > maxAge && now > state.lockoutUntil) {
            securityStates.delete(key);
        }
    }
}

function getClientFingerprint(h: Headers): string {
    const forwarded = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");
    const cfIp = h.get("cf-connecting-ip");
    const userAgent = h.get("user-agent") || "unknown";
    const ip = cfIp || forwarded?.split(",")[0]?.trim() || realIp || "unknown";
    return `${ip}::${userAgent.substring(0, 50)}`;
}

function getLockoutDuration(level: number): number {
    return BASE_LOCKOUT_DURATION * Math.pow(2, Math.min(level - 1, MAX_LOCKOUT_LEVEL - 1));
}

async function randomDelay(): Promise<void> {
    const delay = 50 + Math.random() * 150;
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * POST /api/auth/verify-vault-pin — PUBLIC (pre-session, 4th security layer)
 */
export const POST = createApiHandler(
    { skipAuth: true, bodySchema: vaultPinSchema },
    async (req: NextRequest, ctx) => {
        const startTime = Date.now();

        if (Math.random() < 0.1) cleanOldEntries();

        const fingerprint = getClientFingerprint(req.headers);
        const now = Date.now();

        let state = securityStates.get(fingerprint);
        if (!state) {
            state = { attempts: 0, lastAttempt: 0, lockoutUntil: 0, lockoutLevel: 0 };
            securityStates.set(fingerprint, state);
        }

        // Check lockout
        if (state.lockoutUntil > now) {
            const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            await randomDelay();
            return NextResponse.json(
                {
                    error: `Security lockout active. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`,
                    locked: true,
                    remainingSeconds,
                },
                { status: 429 },
            );
        }

        if (now - state.lastAttempt > ATTEMPT_WINDOW) {
            state.attempts = 0;
        }

        const { pin } = ctx.body;

        // Validate PIN format (must be 6-12 digits per M03 schema)
        if (!pin || !/^\d{6,12}$/.test(pin)) {
            state.attempts++;
            state.lastAttempt = now;
            if (state.attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                state.lockoutLevel = Math.min(state.lockoutLevel + 1, MAX_LOCKOUT_LEVEL);
                state.lockoutUntil = now + getLockoutDuration(state.lockoutLevel);
                state.attempts = 0;
                // L07: Alert SUPER_ADMINs on lockout escalation
                sendSecurityAlert({
                    event: "lockout_triggered",
                    email: "unknown",
                    ipAddress: fingerprint.split("::")[0],
                    description: `Vault PIN lockout escalated to level ${state.lockoutLevel} after invalid format attempts`,
                    severity: state.lockoutLevel >= 3 ? "critical" : "warning",
                    metadata: { lockoutLevel: state.lockoutLevel, trigger: "invalid_format" },
                }).catch(() => {});
            }
            await randomDelay();
            return NextResponse.json({ error: "Invalid PIN format", valid: false }, { status: 400 });
        }

        const vaultPinHash = process.env.ADMIN_VAULT_PIN_HASH;
        if (!vaultPinHash) {
            const isDev = process.env.NODE_ENV === "development";
            console.error("CRITICAL: ADMIN_VAULT_PIN_HASH not configured");
            await randomDelay();
            return NextResponse.json(
                {
                    error: isDev
                        ? "ADMIN_VAULT_PIN_HASH not configured. Run: npx tsx scripts/generate-vault-pin-hash.ts 123"
                        : "Security system misconfigured",
                    valid: false,
                },
                { status: 500 },
            );
        }

        const isValid = await bcrypt.compare(pin, vaultPinHash);
        state.lastAttempt = now;

        if (isValid) {
            state.attempts = 0;
            state.lockoutLevel = Math.max(0, state.lockoutLevel - 1);
            const elapsed = Date.now() - startTime;
            if (elapsed < 200) await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
            return NextResponse.json({ valid: true });
        }

        // Failed attempt
        state.attempts++;
        if (state.attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
            state.lockoutLevel = Math.min(state.lockoutLevel + 1, MAX_LOCKOUT_LEVEL);
            state.lockoutUntil = now + getLockoutDuration(state.lockoutLevel);
            state.attempts = 0;
            const lockoutMinutes = Math.ceil(getLockoutDuration(state.lockoutLevel) / 60000);
            // L07: Alert SUPER_ADMINs on lockout escalation
            sendSecurityAlert({
                event: "lockout_triggered",
                email: "unknown",
                ipAddress: fingerprint.split("::")[0],
                description: `Vault PIN lockout escalated to level ${state.lockoutLevel} after ${MAX_ATTEMPTS_BEFORE_LOCKOUT} failed attempts. Locked for ${lockoutMinutes} minutes.`,
                severity: state.lockoutLevel >= 3 ? "critical" : "warning",
                metadata: { lockoutLevel: state.lockoutLevel, lockoutMinutes, trigger: "failed_attempts" },
            }).catch(() => {});
            const elapsed = Date.now() - startTime;
            if (elapsed < 200) await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
            return NextResponse.json(
                { error: `Too many incorrect attempts. Locked for ${lockoutMinutes} minutes.`, valid: false, locked: true },
                { status: 429 },
            );
        }

        const remainingAttempts = MAX_ATTEMPTS_BEFORE_LOCKOUT - state.attempts;
        const elapsed = Date.now() - startTime;
        if (elapsed < 200) await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
        return NextResponse.json(
            { error: `Invalid PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? "s" : ""} remaining.`, valid: false, remainingAttempts },
            { status: 401 },
        );
    },
);

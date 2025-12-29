import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

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
    lockoutLevel: number; // Progressive lockout escalation
}

const securityStates = new Map<string, SecurityState>();

// Security constants
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 3; // Very strict - only 3 attempts
const BASE_LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes base lockout
const MAX_LOCKOUT_LEVEL = 5; // Maximum escalation (lockout up to 80 mins)
const ATTEMPT_WINDOW = 10 * 60 * 1000; // 10 minute window for attempts

// Clean old entries periodically (memory management)
function cleanOldEntries() {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [key, state] of securityStates.entries()) {
        if (now - state.lastAttempt > maxAge && now > state.lockoutUntil) {
            securityStates.delete(key);
        }
    }
}

// Get client fingerprint (IP + User-Agent hash for uniqueness)
function getClientFingerprint(headersList: Headers): string {
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfIp = headersList.get("cf-connecting-ip"); // Cloudflare
    const userAgent = headersList.get("user-agent") || "unknown";

    const ip = cfIp || forwarded?.split(",")[0]?.trim() || realIp || "unknown";

    // Create a simple fingerprint (not cryptographic, just for rate limiting)
    return `${ip}::${userAgent.substring(0, 50)}`;
}

// Calculate lockout duration based on level (exponential backoff)
function getLockoutDuration(level: number): number {
    // Level 1: 5 mins, Level 2: 10 mins, Level 3: 20 mins, Level 4: 40 mins, Level 5: 80 mins
    return BASE_LOCKOUT_DURATION * Math.pow(2, Math.min(level - 1, MAX_LOCKOUT_LEVEL - 1));
}

// Add random delay to prevent timing analysis (50-200ms)
async function randomDelay(): Promise<void> {
    const delay = 50 + Math.random() * 150;
    await new Promise(resolve => setTimeout(resolve, delay));
}

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // Clean old entries occasionally
        if (Math.random() < 0.1) cleanOldEntries();

        const headersList = await headers();
        const fingerprint = getClientFingerprint(headersList);

        // Get or initialize security state
        let state = securityStates.get(fingerprint);
        const now = Date.now();

        if (!state) {
            state = {
                attempts: 0,
                lastAttempt: 0,
                lockoutUntil: 0,
                lockoutLevel: 0
            };
            securityStates.set(fingerprint, state);
        }

        // Check if currently locked out
        if (state.lockoutUntil > now) {
            const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
            const remainingMinutes = Math.ceil(remainingSeconds / 60);

            // Add random delay before responding (anti-timing)
            await randomDelay();

            return NextResponse.json(
                {
                    error: `Security lockout active. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`,
                    locked: true,
                    remainingSeconds
                },
                { status: 429 }
            );
        }

        // Reset attempts if outside the window
        if (now - state.lastAttempt > ATTEMPT_WINDOW) {
            state.attempts = 0;
        }

        // Parse request
        const body = await request.json();
        const { pin } = body;

        // Validate PIN format (must be exactly 3 digits)
        if (!pin || typeof pin !== "string" || !/^\d{3}$/.test(pin)) {
            state.attempts++;
            state.lastAttempt = now;

            // Check if we need to lock out
            if (state.attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                state.lockoutLevel = Math.min(state.lockoutLevel + 1, MAX_LOCKOUT_LEVEL);
                state.lockoutUntil = now + getLockoutDuration(state.lockoutLevel);
                state.attempts = 0;
            }

            await randomDelay();

            return NextResponse.json(
                { error: "Invalid PIN format", valid: false },
                { status: 400 }
            );
        }

        // Get the vault PIN hash from environment (NEVER from database)
        const vaultPinHash = process.env.ADMIN_VAULT_PIN_HASH;

        if (!vaultPinHash) {
            // This should never happen in production
            console.error("CRITICAL: ADMIN_VAULT_PIN_HASH not configured");
            await randomDelay();
            return NextResponse.json(
                { error: "Security system misconfigured", valid: false },
                { status: 500 }
            );
        }

        // Verify PIN using bcrypt (constant-time comparison built-in)
        const isValid = await bcrypt.compare(pin, vaultPinHash);

        // Update state based on result
        state.lastAttempt = now;

        if (isValid) {
            // Success - reset state completely
            state.attempts = 0;
            state.lockoutLevel = Math.max(0, state.lockoutLevel - 1); // Reduce lockout level on success

            // Ensure minimum response time (prevents timing attacks)
            const elapsed = Date.now() - startTime;
            if (elapsed < 200) {
                await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
            }

            return NextResponse.json({ valid: true });
        } else {
            // Failed attempt
            state.attempts++;

            // Check if we need to lock out
            if (state.attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                state.lockoutLevel = Math.min(state.lockoutLevel + 1, MAX_LOCKOUT_LEVEL);
                state.lockoutUntil = now + getLockoutDuration(state.lockoutLevel);
                state.attempts = 0;

                const lockoutMinutes = Math.ceil(getLockoutDuration(state.lockoutLevel) / 60000);

                // Ensure minimum response time
                const elapsed = Date.now() - startTime;
                if (elapsed < 200) {
                    await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
                }

                return NextResponse.json(
                    {
                        error: `Too many incorrect attempts. Locked for ${lockoutMinutes} minutes.`,
                        valid: false,
                        locked: true
                    },
                    { status: 429 }
                );
            }

            const remainingAttempts = MAX_ATTEMPTS_BEFORE_LOCKOUT - state.attempts;

            // Ensure minimum response time
            const elapsed = Date.now() - startTime;
            if (elapsed < 200) {
                await new Promise(resolve => setTimeout(resolve, 200 - elapsed));
            }

            return NextResponse.json(
                {
                    error: `Invalid PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
                    valid: false,
                    remainingAttempts
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Vault PIN verification error:", error);
        await randomDelay();
        return NextResponse.json(
            { error: "Verification failed", valid: false },
            { status: 500 }
        );
    }
}

// Prevent other HTTP methods
export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

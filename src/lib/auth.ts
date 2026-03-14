import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSecurityAlert } from "@/lib/security-alerts";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Maximum login attempts before lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Extract the real client IP from NextAuth request headers
 * Handles Cloudflare, Vercel, and nginx proxy setups
 */
function extractIPFromHeaders(headers: Record<string, string | string[] | undefined>): string {
    // Helper to get string value from header
    const getHeader = (name: string): string | undefined => {
        const value = headers[name];
        return Array.isArray(value) ? value[0] : value;
    };

    // Priority order for IP extraction
    const possibleIPs = [
        getHeader("cf-connecting-ip"),      // Cloudflare
        getHeader("true-client-ip"),        // Cloudflare Enterprise / Akamai
        getHeader("x-real-ip"),             // nginx
        getHeader("x-forwarded-for")?.split(",")[0]?.trim(),  // Standard proxy
        getHeader("x-vercel-forwarded-for"), // Vercel
    ].filter(Boolean);

    return possibleIPs[0] || "unknown";
}

// Check if admin user is locked out due to failed login attempts
async function isAdminLockedOut(email: string, ipAddress: string): Promise<boolean> {
    const lockoutTime = new Date(Date.now() - LOCKOUT_DURATION).toISOString();

    const { data, error } = await supabaseAdmin
        .from('admin_login_attempts')
        .select('*')
        .eq('email', email)
        .eq('ip_address', ipAddress)
        .eq('success', false)
        .gte('created_at', lockoutTime)
        .order('created_at', { ascending: false })
        .limit(MAX_LOGIN_ATTEMPTS);

    if (error) {
        console.error('Error checking admin login attempts:', error);
        return false;
    }

    return (data?.length || 0) >= MAX_LOGIN_ATTEMPTS;
}

// Record admin login attempt
async function recordAdminLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string | null,
    success: boolean,
    adminUserId?: string,
    failureReason?: string
) {
    await supabaseAdmin
        .from('admin_login_attempts')
        .insert({
            email,
            ip_address: ipAddress,
            user_agent: userAgent,
            success,
            admin_user_id: adminUserId || null,
            attempt_type: 'password',
            failure_reason: failureReason || null,
            device_info: {},
            geo_location: {}
        });
}

// Log admin activity
async function logAdminActivity(
    adminUserId: string,
    action: string,
    resourceType: string,
    ipAddress: string,
    userAgent: string | null,
    description?: string
) {
    await supabaseAdmin
        .from('admin_activity_log')
        .insert({
            admin_user_id: adminUserId,
            action,
            resource_type: resourceType,
            ip_address: ipAddress,
            user_agent: userAgent,
            description: description || null,
            severity: 'info',
            changes: {}
        });
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password required");
                }

                // Extract real IP using priority order for proxy headers
                const ipAddress = extractIPFromHeaders(req.headers || {});
                const userAgent = req.headers?.["user-agent"] || null;

                // Check if admin is locked out
                const lockedOut = await isAdminLockedOut(credentials.email, ipAddress);
                if (lockedOut) {
                    await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, undefined, "Too many failed attempts");
                    // Alert SUPER_ADMINs about lockout (non-blocking)
                    sendSecurityAlert({
                        event: "lockout_triggered",
                        email: credentials.email,
                        ipAddress,
                        description: `Account locked out after ${MAX_LOGIN_ATTEMPTS} failed login attempts within ${LOCKOUT_DURATION / 60000} minutes.`,
                        severity: "critical",
                    });
                    throw new Error("Invalid credentials");
                }

                // Find admin user
                const { data: admin, error } = await supabaseAdmin
                    .from('admin_users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (error || !admin || !admin.password_hash) {
                    await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, undefined, "Invalid credentials");
                    throw new Error("Invalid credentials");
                }

                // Check if admin account is active
                if (!admin.is_active) {
                    await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, admin.id, "Account disabled");
                    throw new Error("Invalid credentials");
                }

                // Check if admin account is locked
                if (admin.is_locked) {
                    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
                        await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, admin.id, "Account locked");
                        throw new Error("Invalid credentials");
                    }
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(credentials.password, admin.password_hash);
                if (!isValidPassword) {
                    await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, admin.id, "Invalid password");
                    // Alert SUPER_ADMINs about repeated failures (non-blocking)
                    sendSecurityAlert({
                        event: "repeated_failures",
                        email: credentials.email,
                        ipAddress,
                        description: "Failed login attempt — invalid password.",
                        severity: "warning",
                    });
                    throw new Error("Invalid credentials");
                }

                // Check if admin has proper role (ADMIN, SUPER_ADMIN, or MODERATOR)
                if (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN" && admin.role !== "MODERATOR") {
                    await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, false, admin.id, "Insufficient permissions");
                    throw new Error("Invalid credentials");
                }

                // Record successful login
                await recordAdminLoginAttempt(credentials.email, ipAddress, userAgent, true, admin.id);

                // Update last login info
                await supabaseAdmin
                    .from('admin_users')
                    .update({
                        last_login_at: new Date().toISOString(),
                        last_login_ip: ipAddress
                    })
                    .eq('id', admin.id);

                // Log admin activity
                await logAdminActivity(
                    admin.id,
                    'LOGIN',
                    'auth',
                    ipAddress,
                    userAgent,
                    'Admin user logged in successfully'
                );

                // Create session record for tracking
                try {
                    const sessionToken = randomBytes(48).toString("hex");
                    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

                        await supabaseAdmin
                            .from('admin_sessions')
                            .insert({
                                admin_user_id: admin.id,
                                session_token: sessionToken,
                                ip_address: ipAddress,
                                user_agent: userAgent,
                                device_info: {},
                                expires_at: expiresAt.toISOString(),
                                last_activity_at: new Date().toISOString(),
                                is_revoked: false
                            });
                } catch (sessionError) {
                    console.error('Error creating session record:', sessionError);
                    // Don't fail login if session creation fails
                }

                return {
                    id: admin.id,
                    email: admin.email,
                    name: admin.full_name,
                    role: admin.role,
                    image: admin.avatar_url,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 2 * 60 * 60, // 2 hours for admin sessions
        updateAge: 30 * 60, // Update session every 30 minutes
    },
    pages: {
        signIn: "/admin/login",
        error: "/admin/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.image = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.image = token.image;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Always redirect admin users to admin panel
            if (url.includes("/admin")) {
                return url;
            }
            return `${baseUrl}/admin`;
        },
    },
    events: {
        async signOut({ token }) {
            // H03: Invalidate all active sessions for this user on logout
            if (token?.id) {
                try {
                    await supabaseAdmin
                        .from('admin_sessions')
                        .update({ is_revoked: true })
                        .eq('admin_user_id', token.id as string)
                        .eq('is_revoked', false);
                } catch (err) {
                    console.error('Failed to revoke sessions on signOut:', err);
                }
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    // M11: Cookie security verified — httpOnly + sameSite strict + secure in production
    // This matches bank-level standards: no JS access, no cross-origin sending, HTTPS only
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production"
                ? `__Secure-next-auth.session-token`
                : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "strict",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
};

import { createNotification, getAllAdminUsers } from "./notifications";

// ─────────────────────────────────────────────
// Security Event Alerting
// ─────────────────────────────────────────────
// Sends in-app notifications to all SUPER_ADMIN users
// when critical auth/security events occur.
// ─────────────────────────────────────────────

export type SecurityEventType =
    | "lockout_triggered"
    | "repeated_failures"
    | "new_admin_created"
    | "admin_role_changed"
    | "session_revoked"
    | "biometric_enrolled"
    | "biometric_failure";

interface SecurityAlertOptions {
    event: SecurityEventType;
    email: string;
    ipAddress: string;
    description: string;
    severity: "warning" | "critical";
    metadata?: Record<string, unknown>;
}

const EVENT_TITLES: Record<SecurityEventType, string> = {
    lockout_triggered: "Account Lockout Triggered",
    repeated_failures: "Repeated Login Failures Detected",
    new_admin_created: "New Admin Account Created",
    admin_role_changed: "Admin Role Changed",
    session_revoked: "Admin Session Revoked",
    biometric_enrolled: "Biometric Device Enrolled",
    biometric_failure: "Biometric Authentication Failed",
};

/**
 * Send a security alert notification to all SUPER_ADMIN users.
 * Non-blocking — failures are logged but do not propagate.
 */
export async function sendSecurityAlert(options: SecurityAlertOptions): Promise<void> {
    try {
        const allUsers = await getAllAdminUsers();
        const superAdmins = allUsers.filter((u) => u.role === "SUPER_ADMIN");

        if (superAdmins.length === 0) {
            console.warn("[security-alert] No SUPER_ADMIN users found to notify");
            return;
        }

        const title = EVENT_TITLES[options.event] ?? "Security Event";
        const message = `${options.description}\n\nIP: ${options.ipAddress}\nAccount: ${options.email}`;

        await Promise.allSettled(
            superAdmins.map((admin) =>
                createNotification({
                    recipientId: admin.id,
                    type: "system_alert",
                    title,
                    message,
                    priority: options.severity === "critical" ? "urgent" : "high",
                    relatedEntityType: "security_event",
                    metadata: {
                        event: options.event,
                        email: options.email,
                        ip_address: options.ipAddress,
                        severity: options.severity,
                        ...options.metadata,
                    },
                }),
            ),
        );
    } catch (err) {
        // Security alerts must never break the auth flow
        console.error("[security-alert] Failed to send alert:", err);
    }
}

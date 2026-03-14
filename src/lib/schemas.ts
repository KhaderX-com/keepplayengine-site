import { z } from "zod";

// ─── Reusable Primitives ───

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email().max(254);
// L03: Support both 6-digit (#RRGGBB) and 8-digit (#RRGGBBAA) hex colors
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/, "Invalid hex color");

// ─── Auth ───

export const credentialsSchema = z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(128),
});

export const vaultPinSchema = z.object({
    // M03: Minimum 6 digits to resist brute-force on bcrypt hash if env is leaked
    pin: z.string().min(6).max(12),
});

export const deleteDeviceSchema = z.object({
    credentialId: z.string().min(1),
});

// ─── WebAuthn ───
// Credential schemas match @simplewebauthn/browser output (RegistrationResponseJSON / AuthenticationResponseJSON)

export const webauthnEmailSchema = z.object({
    email: z.string().email(),
});

const webauthnRegistrationResponseSchema = z.object({
    id: z.string().min(1),
    rawId: z.string().min(1),
    type: z.literal("public-key"),
    response: z.object({
        clientDataJSON: z.string().min(1),
        attestationObject: z.string().min(1),
        transports: z.array(z.string()).optional(),
        publicKeyAlgorithm: z.number().optional(),
        publicKey: z.string().optional(),
        authenticatorData: z.string().optional(),
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().optional(),
});

const webauthnAuthenticationResponseSchema = z.object({
    id: z.string().min(1),
    rawId: z.string().min(1),
    type: z.literal("public-key"),
    response: z.object({
        clientDataJSON: z.string().min(1),
        authenticatorData: z.string().min(1),
        signature: z.string().min(1),
        userHandle: z.string().optional().nullable().transform(v => v ?? undefined),
    }),
    clientExtensionResults: z.record(z.string(), z.unknown()).optional(),
    authenticatorAttachment: z.string().optional(),
});

export const webauthnRegisterVerifySchema = z.object({
    email: z.string().email(),
    credential: webauthnRegistrationResponseSchema,
    deviceName: z.string().optional(),
});

export const webauthnAuthVerifySchema = z.object({
    credential: webauthnAuthenticationResponseSchema,
    email: z.string().email(),
});

// ─── Tasks ───

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(500),
    description: z.string().max(10000).optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee_id: z.string().uuid().optional().nullable(),
    assignee_ids: z.array(z.string().uuid()).optional(),
    color: z.string().optional().nullable(),
    parent_task_id: z.string().uuid().optional(),
    due_date: z.string().optional(),
    estimated_hours: z.number().optional(),
    label_ids: z.array(z.string().uuid()).optional(),
    is_milestone: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(10000).nullable().optional(),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee_id: z.string().uuid().nullable().optional(),
    position: z.number().optional(),
    due_date: z.string().nullable().optional(),
    estimated_hours: z.number().nullable().optional(),
    actual_hours: z.number().nullable().optional(),
    color: z.string().nullable().optional(),
    is_milestone: z.boolean().optional(),
    label_ids: z.array(z.string().uuid()).optional(),
});

export const commentSchema = z.object({
    content: z.string().min(1, "Content is required").max(10000),
});

// ─── Labels ───

export const createLabelSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    color: hexColorSchema.optional(),
    description: z.string().max(2000).optional().nullable(),
});

export const updateLabelSchema = z.object({
    name: z.string().min(1, "Name cannot be empty").max(200).optional(),
    color: hexColorSchema.optional(),
    description: z.string().max(2000).optional().nullable(),
}).refine((data) => Object.keys(data).length > 0, { message: "No updates provided" });

// ─── Team Members ───

export const createTeamMemberSchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email().max(254).optional().nullable(),
    avatar_url: z.string().url().max(2048).optional().nullable(),
    color: hexColorSchema.optional(),
});

// ─── Notifications ───

export const markNotificationsReadSchema = z.object({
    action: z.literal("mark_read"),
    notificationIds: z.array(z.string().uuid()).optional(),
});

export const sendNotificationSchema = z.object({
    recipient_email: z.string().email(),
    type: z.enum([
        "direct_message", "mention", "task_assigned", "task_updated",
        "task_completed", "system_alert", "announcement", "reminder",
        "approval_request", "approval_response",
    ]),
    title: z.string().min(1).max(500),
    message: z.string().min(1).max(5000),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    action_url: z.string().url()
        .refine(
            (url) => {
                try {
                    const parsed = new URL(url);
                    const allowed = process.env.NEXTAUTH_URL
                        ? new URL(process.env.NEXTAUTH_URL).hostname
                        : "keepplayengine.com";
                    return parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`);
                } catch { return false; }
            },
            "action_url must point to an internal domain",
        )
        .optional(),
    action_label: z.string().max(200).optional(),
    related_entity_type: z.string().optional(),
    related_entity_id: z.string().optional(),
    metadata: z.record(z.string().max(100), z.unknown()).optional().refine(
        (val) => !val || JSON.stringify(val).length <= 8192,
        { message: "Metadata too large (max 8KB)" }
    ),
});

export const emailNotificationSchema = z.object({
    notificationId: z.string().uuid().optional(),
    testEmail: z.string().email().optional(),
}).refine((d) => d.notificationId || d.testEmail, { message: "notificationId or testEmail required" });

export const pushSubscriptionSchema = z.object({
    subscription: z.object({
        endpoint: z.string().url(),
        keys: z.object({
            p256dh: z.string().min(1),
            auth: z.string().min(1),
        }),
    }),
    deviceInfo: z.record(z.string(), z.unknown()).optional(),
});

export const deletePushSubscriptionSchema = z.object({
    subscriptionId: z.string().uuid(),
});

// ─── Admin ───

export const deleteActivityLogsSchema = z.object({
    deleteBeforeDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

export const deleteSessionSchema = z.object({
    id: z.string().uuid("Invalid session ID"),
});

// ─── Milestones ───

export const createMilestoneSchema = z.object({
    task_id: z.string().uuid(),
    description: z.string().max(5000).nullable().optional(),
    target_date: z.string().nullable().optional(),
});

export const updateMilestoneSchema = z.object({
    description: z.string().max(5000).nullable().optional(),
    target_date: z.string().nullable().optional(),
    status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    progress_percentage: z.number().min(0).max(100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

export const createSubMilestoneSchema = z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).nullable().optional(),
    target_date: z.string().nullable().optional(),
    assignee_id: z.string().uuid().nullable().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    notes: z.string().max(5000).nullable().optional(),
    major_number: z.number().int().positive().optional(),
    minor_number: z.number().int().positive().optional(),
});

export const updateSubMilestoneSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: z.enum(["not_started", "in_progress", "completed"]).optional(),
    target_date: z.string().nullable().optional(),
    assignee_id: z.string().uuid().nullable().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    notes: z.string().max(5000).nullable().optional(),
    progress_percentage: z.number().min(0).max(100).optional(),
    position: z.number().int().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" });

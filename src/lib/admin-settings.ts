import { AdminDAL } from "@/lib/dal";

export const ADMIN_SESSION_DURATION_KEY = "admin_session_duration_hours";
export const DEFAULT_ADMIN_SESSION_DURATION_HOURS = 6;
export const MIN_ADMIN_SESSION_DURATION_HOURS = 1;
export const MAX_ADMIN_SESSION_DURATION_HOURS = 24;

export type AdminSessionSettings = {
    sessionDurationHours: number;
};

function normalizeSessionDurationHours(value: unknown): number {
    const numericValue = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(numericValue)) {
        return DEFAULT_ADMIN_SESSION_DURATION_HOURS;
    }

    return Math.min(
        MAX_ADMIN_SESSION_DURATION_HOURS,
        Math.max(MIN_ADMIN_SESSION_DURATION_HOURS, Math.round(numericValue)),
    );
}

export function validateAdminSessionDurationHours(value: unknown): number {
    const numericValue = Number(value);

    if (
        !Number.isInteger(numericValue) ||
        numericValue < MIN_ADMIN_SESSION_DURATION_HOURS ||
        numericValue > MAX_ADMIN_SESSION_DURATION_HOURS
    ) {
        throw new Error(
            `Session duration must be an integer between ${MIN_ADMIN_SESSION_DURATION_HOURS} and ${MAX_ADMIN_SESSION_DURATION_HOURS} hours.`,
        );
    }

    return numericValue;
}

export async function getAdminSessionDurationHours(): Promise<number> {
    const { data, error } = await AdminDAL.getAdminSetting(ADMIN_SESSION_DURATION_KEY);

    if (error) {
        console.error("Failed to load admin session duration setting:", error);
        return DEFAULT_ADMIN_SESSION_DURATION_HOURS;
    }

    return normalizeSessionDurationHours(data?.value);
}

export async function getAdminSessionSettings(): Promise<AdminSessionSettings> {
    return {
        sessionDurationHours: await getAdminSessionDurationHours(),
    };
}

export async function updateAdminSessionDurationHours(value: unknown, updatedBy: string) {
    const sessionDurationHours = validateAdminSessionDurationHours(value);

    const { data, error } = await AdminDAL.upsertAdminSetting({
        key: ADMIN_SESSION_DURATION_KEY,
        value: sessionDurationHours,
        description: "Admin session duration in hours. Controls new admin session expiry.",
        updated_by: updatedBy,
    });

    if (error) {
        throw error;
    }

    return {
        sessionDurationHours: normalizeSessionDurationHours(data.value),
    };
}

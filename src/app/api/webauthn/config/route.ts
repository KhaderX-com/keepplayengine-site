import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/webauthn/config
 * Fetch biometric configuration from Supabase
 * 
 * SECURITY NOTE: This endpoint is PUBLIC (no auth required) because:
 * 1. It's needed BEFORE user authentication (during login flow)
 * 2. Returns only read-only boolean flags (UI control)
 * 3. No sensitive data is exposed
 * 4. Database table has RLS protecting write operations
 * 
 * This controls:
 * - Whether biometric layer is visible at all (emergency kill switch)
 * - Whether users can enroll new biometric devices
 */
export async function GET() {
    try {
        // Note: This endpoint is intentionally PUBLIC (no auth required)
        // It only returns read-only configuration flags that control UI behavior
        // The actual security is enforced by RLS on the database table

        // Fetch global biometric configuration from Supabase
        const { data, error } = await supabaseAdmin
            .from('biometric_config')
            .select('*')
            .eq('id', 'global')
            .single();

        if (error) {
            // If config doesn't exist, return safe defaults (disabled)
            if (error.code === 'PGRST116') { // Row not found
                return NextResponse.json({
                    biometricEnabled: false,
                    allowEnrollment: false,
                    message: "Biometric configuration not initialized. Please contact admin."
                });
            }

            console.error('Error fetching biometric config:', error);
            return NextResponse.json(
                { error: "Failed to fetch biometric configuration" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            biometricEnabled: data.biometric_enabled,
            allowEnrollment: data.allow_enrollment,
            notes: data.notes
        });
    } catch (error) {
        console.error('Biometric config error:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/webauthn/config
 * Fetch biometric configuration from Supabase
 * This controls:
 * - Whether biometric layer is visible at all (emergency kill switch)
 * - Whether users can enroll new biometric devices
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

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

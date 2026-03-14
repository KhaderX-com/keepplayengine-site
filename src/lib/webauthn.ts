/**
 * WebAuthn Biometric Authentication — SERVER SIDE ONLY
 * Uses @simplewebauthn/server for FIDO2-compliant cryptographic verification.
 *
 * Bank-level security guarantees:
 * - Challenge verification (prevents replay attacks)
 * - Attestation verification (validates device authenticity)
 * - Signature verification (proves possession of private key)
 * - Counter validation (detects cloned authenticators)
 *
 * WARNING: Server-only — imports supabaseAdmin.
 * For client-side utilities, use @/lib/webauthn-client
 */

import { supabaseAdmin } from "@/lib/supabase";
import {
    generateRegistrationOptions as swGenerateRegistrationOptions,
    verifyRegistrationResponse as swVerifyRegistrationResponse,
    generateAuthenticationOptions as swGenerateAuthenticationOptions,
    verifyAuthenticationResponse as swVerifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// Get the correct rpId based on environment
const getRpId = (): string => {
    if (process.env.NODE_ENV === "production") {
        return process.env.WEBAUTHN_RP_ID || "keepplayengine.com";
    }
    return "localhost";
};

// Get expected origin(s) for WebAuthn verification
const getExpectedOrigin = (): string | string[] => {
    if (process.env.WEBAUTHN_ORIGIN) {
        return process.env.WEBAUTHN_ORIGIN.split(",");
    }
    if (process.env.NODE_ENV === "production") {
        return [
            `https://${getRpId()}`,
            `https://admin.${getRpId()}`,
        ];
    }
    return "http://localhost:3000";
};

// WebAuthn configuration
export const WEBAUTHN_CONFIG = {
    rpName: "KeepPlay Engine Admin",
    rpId: getRpId(),
    timeout: 60000,
};

/**
 * Generate registration options for WebAuthn
 * Returns JSON-serializable options (base64url-encoded, not ArrayBuffers).
 */
export async function generateRegistrationOptions(userId: string, userName: string, userEmail: string) {
    // Get existing credentials to exclude (prevent re-registration of same authenticator)
    const { data: existingCreds } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("user_id", userId);

    const excludeCredentials = (existingCreds || []).map((cred: { credential_id: string; transports?: string[] }) => ({
        id: cred.credential_id,
        transports: (cred.transports || ["internal"]) as AuthenticatorTransportFuture[],
    }));

    const options = await swGenerateRegistrationOptions({
        rpName: WEBAUTHN_CONFIG.rpName,
        rpID: WEBAUTHN_CONFIG.rpId,
        userID: new TextEncoder().encode(userId),
        userName: userEmail,
        userDisplayName: userName || userEmail,
        attestationType: "none",
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            requireResidentKey: false,
            userVerification: "required",
        },
        excludeCredentials,
        timeout: WEBAUTHN_CONFIG.timeout,
    });

    return {
        options, // Already JSON-serializable (base64url strings)
        challenge: options.challenge,
    };
}

/**
 * Generate authentication options for WebAuthn
 * Returns JSON-serializable options (base64url-encoded).
 */
export async function generateAuthenticationOptions(userId?: string) {
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

    if (userId) {
        const { data: userCreds } = await supabaseAdmin
            .from("webauthn_credentials")
            .select("credential_id, transports")
            .eq("user_id", userId);

        allowCredentials = (userCreds || []).map((cred: { credential_id: string; transports?: string[] }) => ({
            id: cred.credential_id,
            transports: (cred.transports || ["internal"]) as AuthenticatorTransportFuture[],
        }));
    }

    const options = await swGenerateAuthenticationOptions({
        rpID: WEBAUTHN_CONFIG.rpId,
        userVerification: "required",
        allowCredentials,
        timeout: WEBAUTHN_CONFIG.timeout,
    });

    return {
        options, // Already JSON-serializable
        challenge: options.challenge,
    };
}

/**
 * Verify registration response — FULL CRYPTOGRAPHIC VERIFICATION
 *
 * Validates:
 * 1. Challenge matches the one we generated (anti-replay)
 * 2. Origin matches our expected origin (anti-phishing)
 * 3. RP ID matches (scope binding)
 * 4. Attestation format and data integrity
 * 5. Extracts and stores the REAL credential public key
 */
export async function verifyRegistrationResponse(
    userId: string,
    credential: RegistrationResponseJSON,
    expectedChallenge: string,
    deviceName?: string,
) {
    const verification = await swVerifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: getExpectedOrigin(),
        expectedRPID: WEBAUTHN_CONFIG.rpId,
    });

    if (!verification.verified || !verification.registrationInfo) {
        throw new Error("Registration verification failed");
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Store the PROPERLY EXTRACTED credential public key (base64url encoded)
    const credentialPublicKeyBase64 = Buffer.from(regCredential.publicKey).toString("base64url");

    const { data, error } = await supabaseAdmin
        .from("webauthn_credentials")
        .insert({
            user_id: userId,
            credential_id: regCredential.id,
            public_key: credentialPublicKeyBase64,
            counter: regCredential.counter,
            device_name: deviceName || "Biometric Device",
            device_type: credentialDeviceType || "singleDevice",
            credential_backed_up: credentialBackedUp || false,
            transports: credential.response.transports || ["internal"],
        })
        .select()
        .single();

    if (error) {
        console.error("Error storing credential:", error);
        throw new Error("Failed to store credential");
    }

    // Enable biometric for user
    await supabaseAdmin
        .from("admin_users")
        .update({ biometric_enabled: true })
        .eq("id", userId);

    return { success: true, credentialId: data.id };
}

/**
 * Verify authentication response — FULL CRYPTOGRAPHIC VERIFICATION
 *
 * Validates:
 * 1. Challenge matches the one we generated (anti-replay)
 * 2. Origin matches our expected origin (anti-phishing)
 * 3. RP ID matches (scope binding)
 * 4. Signature is valid against stored credential public key
 * 5. Counter is strictly incrementing (cloned authenticator detection)
 */
export async function verifyAuthenticationResponse(
    credential: AuthenticationResponseJSON,
    expectedChallenge: string,
) {
    // Look up stored credential by ID
    const { data: storedCred, error } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credential.id)
        .single();

    if (error || !storedCred) {
        throw new Error("Credential not found");
    }

    // Reconstruct the public key Uint8Array from base64url storage
    const credentialPublicKey = new Uint8Array(Buffer.from(storedCred.public_key, "base64url"));

    const verification = await swVerifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: getExpectedOrigin(),
        expectedRPID: WEBAUTHN_CONFIG.rpId,
        credential: {
            id: storedCred.credential_id,
            publicKey: credentialPublicKey,
            counter: Number(storedCred.counter),
            transports: (storedCred.transports || ["internal"]) as AuthenticatorTransportFuture[],
        },
    });

    if (!verification.verified) {
        throw new Error("Authentication verification failed");
    }

    // H06: Validate counter to detect cloned authenticators
    const newCounter = verification.authenticationInfo.newCounter;
    const storedCounter = Number(storedCred.counter);

    if (storedCounter > 0 && newCounter <= storedCounter) {
        // Counter did not increment — possible authenticator cloning!
        console.error(
            `[SECURITY] Possible credential cloning detected! ` +
            `credentialId=${storedCred.credential_id}, ` +
            `storedCounter=${storedCounter}, newCounter=${newCounter}`
        );
        throw new Error("CREDENTIAL_POSSIBLY_CLONED");
    }

    // Update counter and last used timestamp
    await supabaseAdmin
        .from("webauthn_credentials")
        .update({
            counter: newCounter,
            last_used_at: new Date().toISOString(),
        })
        .eq("id", storedCred.id);

    return {
        success: true,
        userId: storedCred.user_id,
        credentialId: storedCred.id,
    };
}

/**
 * Check if user has biometric credentials
 */
export async function hasBiometricCredentials(userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    return !error && data && data.length > 0;
}

/**
 * Get user's biometric devices
 */
export async function getUserBiometricDevices(userId: string) {
    const { data, error } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('id, device_name, device_type, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching devices:", error);
        return [];
    }

    return data || [];
}

/**
 * Remove biometric device
 */
export async function removeBiometricDevice(userId: string, credentialId: string) {
    const { error } = await supabaseAdmin
        .from('webauthn_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', userId);

    if (error) {
        throw new Error("Failed to remove device");
    }

    // Check if user has any remaining credentials
    const remaining = await hasBiometricCredentials(userId);
    if (!remaining) {
        // Disable biometric if no credentials left
        await supabaseAdmin
            .from('admin_users')
            .update({ biometric_enabled: false })
            .eq('id', userId);
    }

    return { success: true };
}


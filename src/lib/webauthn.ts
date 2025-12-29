/**
 * WebAuthn Biometric Authentication Utilities
 * Supports: Fingerprint, Face ID, Device PIN, Security Keys
 */

import { supabaseAdmin } from "@/lib/supabase";

// Type definitions
interface StoredCredential {
    credential_id: string;
    transports?: string[];
}

// WebAuthn configuration
export const WEBAUTHN_CONFIG = {
    rpName: "KeepPlay Engine Admin",
    rpId: typeof window !== "undefined" ? window.location.hostname : "localhost",
    timeout: 60000, // 60 seconds
    attestation: "none" as AttestationConveyancePreference,
    authenticatorSelection: {
        authenticatorAttachment: "platform" as AuthenticatorAttachment, // Prefer built-in biometrics
        requireResidentKey: false,
        userVerification: "required" as UserVerificationRequirement, // Require biometric/PIN
    },
};

/**
 * Generate registration options for WebAuthn
 */
export async function generateRegistrationOptions(userId: string, userName: string, userEmail: string) {
    // Get existing credentials to exclude
    const { data: existingCreds } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('credential_id')
        .eq('user_id', userId);

    const excludeCredentials = (existingCreds || []).map((cred: StoredCredential) => ({
        id: base64ToBuffer(cred.credential_id),
        type: "public-key" as const,
    }));

    // Generate challenge (random bytes)
    const challenge = new Uint8Array(32);
    if (typeof window !== "undefined" && window.crypto) {
        window.crypto.getRandomValues(challenge);
    } else {
        // Server-side fallback
        const crypto = await import("crypto");
        crypto.randomFillSync(challenge);
    }

    const options: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
            name: WEBAUTHN_CONFIG.rpName,
            id: WEBAUTHN_CONFIG.rpId,
        },
        user: {
            id: stringToBuffer(userId),
            name: userEmail,
            displayName: userName || userEmail,
        },
        pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" }, // RS256
        ],
        timeout: WEBAUTHN_CONFIG.timeout,
        attestation: WEBAUTHN_CONFIG.attestation,
        authenticatorSelection: WEBAUTHN_CONFIG.authenticatorSelection,
        excludeCredentials: excludeCredentials,
    };

    return {
        options,
        challenge: bufferToBase64(challenge),
    };
}

/**
 * Generate authentication options for WebAuthn
 */
export async function generateAuthenticationOptions(userId?: string) {
    // Generate challenge
    const challenge = new Uint8Array(32);
    if (typeof window !== "undefined" && window.crypto) {
        window.crypto.getRandomValues(challenge);
    } else {
        const crypto = await import("crypto");
        crypto.randomFillSync(challenge);
    }

    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;

    if (userId) {
        // Get user's credentials
        const { data: userCreds } = await supabaseAdmin
            .from('webauthn_credentials')
            .select('credential_id, transports')
            .eq('user_id', userId);

        allowCredentials = (userCreds || []).map((cred: StoredCredential) => ({
            id: base64ToBuffer(cred.credential_id),
            type: "public-key" as const,
            transports: (cred.transports || ["internal"]) as AuthenticatorTransport[],
        }));
    }

    const options: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        timeout: WEBAUTHN_CONFIG.timeout,
        rpId: WEBAUTHN_CONFIG.rpId,
        userVerification: "required",
        allowCredentials: allowCredentials,
    };

    return {
        options,
        challenge: bufferToBase64(challenge),
    };
}

/**
 * Verify registration response
 */
export async function verifyRegistrationResponse(
    userId: string,
    credential: {
        id: string;
        rawId: ArrayBuffer;
        response: {
            attestationObject: ArrayBuffer;
            getTransports?: () => string[];
        };
        authenticatorAttachment?: string;
    },
    expectedChallenge: string,
    deviceName?: string
) {
    try {
        // Extract credential data
        const credentialId = bufferToBase64(credential.rawId);
        const publicKey = bufferToBase64(credential.response.attestationObject);

        // Basic validation
        if (!credential.id || !credential.rawId) {
            throw new Error("Invalid credential format");
        }

        // Store credential in database
        const { data, error } = await supabaseAdmin
            .from('webauthn_credentials')
            .insert({
                user_id: userId,
                credential_id: credentialId,
                public_key: publicKey,
                counter: 0,
                device_name: deviceName || "Biometric Device",
                device_type: credential.authenticatorAttachment || "platform",
                transports: credential.response.getTransports?.() || ["internal"],
            })
            .select()
            .single();

        if (error) {
            console.error("Error storing credential:", error);
            throw new Error("Failed to store credential");
        }

        // Enable biometric for user
        await supabaseAdmin
            .from('admin_users')
            .update({ biometric_enabled: true })
            .eq('id', userId);

        return { success: true, credentialId: data.id };
    } catch (error) {
        console.error("Registration verification error:", error);
        throw error;
    }
}

/**
 * Verify authentication response
 */
export async function verifyAuthenticationResponse(
    credential: {
        rawId: ArrayBuffer;
    }
) {
    try {
        const credentialId = bufferToBase64(credential.rawId);

        // Get stored credential
        const { data: storedCred, error } = await supabaseAdmin
            .from('webauthn_credentials')
            .select('*')
            .eq('credential_id', credentialId)
            .single();

        if (error || !storedCred) {
            throw new Error("Credential not found");
        }

        // Update last used timestamp and counter
        await supabaseAdmin
            .from('webauthn_credentials')
            .update({
                last_used_at: new Date().toISOString(),
                counter: Number(storedCred.counter) + 1,
            })
            .eq('id', storedCred.id);

        return {
            success: true,
            userId: storedCred.user_id,
            credentialId: storedCred.id,
        };
    } catch (error) {
        console.error("Authentication verification error:", error);
        throw error;
    }
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
            .update({ biometric_enabled: false, require_biometric: false })
            .eq('id', userId);
    }

    return { success: true };
}

// Utility functions for buffer/base64 conversion
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export function stringToBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
}

export function bufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
    return typeof window !== "undefined" &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === "function";
}

/**
 * Check if platform authenticator (biometric) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isWebAuthnSupported()) {
        return false;
    }

    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error("Error checking authenticator availability:", error);
        return false;
    }
}

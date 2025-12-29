/**
 * WebAuthn Client-Side Utilities
 * Browser-only functions for WebAuthn support detection
 * This file is safe to import in client-side code
 */

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

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const hex = process.env.PUSH_ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        // Graceful degradation: return null to skip encryption
        return null as unknown as Buffer;
    }
    return Buffer.from(hex, "hex");
}

/** Encrypt a plaintext string. Returns "iv:ciphertext:tag" (hex-encoded). */
export function encryptPII(plaintext: string): string {
    const key = getKey();
    if (!key) return plaintext; // passthrough if key not configured
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

/** Decrypt a "iv:ciphertext:tag" string back to plaintext. */
export function decryptPII(encoded: string): string {
    const key = getKey();
    if (!key) return encoded; // passthrough if key not configured
    const parts = encoded.split(":");
    if (parts.length !== 3) return encoded; // not encrypted, return as-is
    const [ivHex, dataHex, tagHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const data = Buffer.from(dataHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

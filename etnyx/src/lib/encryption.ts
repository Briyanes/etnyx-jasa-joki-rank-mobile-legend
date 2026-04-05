import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const _key = process.env.ENCRYPTION_KEY;

if (!_key) {
  throw new Error("ENCRYPTION_KEY environment variable is required. Set a 32-character secret key.");
}

const ENCRYPTION_KEY: string = _key;

if (ENCRYPTION_KEY.length < 16) {
  throw new Error(`ENCRYPTION_KEY too short (${ENCRYPTION_KEY.length} chars). Minimum 16 characters required.`);
}

if (ENCRYPTION_KEY.length < 32) {
  console.warn(`[SECURITY] ENCRYPTION_KEY is ${ENCRYPTION_KEY.length} chars. Recommended: 32+ characters for AES-256.`);
}

// Derive a proper 32-byte key using SHA-256 (deterministic, no weak padding)
const derivedKey = createHash("sha256").update(ENCRYPTION_KEY).digest();

// Legacy key for backward compatibility with existing encrypted data
const legacyKey = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));

export function encryptField(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptField(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !encrypted) return encryptedText; // Not encrypted (legacy)
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  // Try derived key first, fall back to legacy key for old data
  try {
    const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Fall back to legacy padded key for data encrypted before the fix
    const decipher = createDecipheriv("aes-256-gcm", legacyKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

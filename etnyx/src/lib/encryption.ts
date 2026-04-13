import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const _key = process.env.ENCRYPTION_KEY;

// Lazy initialization - defer error to function call time instead of module load
let _derivedKey: Buffer | null = null;
let _legacyKey: Buffer | null = null;

function getKeys() {
  if (!_key) {
    throw new Error("ENCRYPTION_KEY environment variable is required. Set a 32-character secret key.");
  }
  if (!_derivedKey) {
    if (_key.length < 16) {
      throw new Error(`ENCRYPTION_KEY too short (${_key.length} chars). Minimum 16 characters required.`);
    }
    if (_key.length < 32) {
      console.warn(`[SECURITY] ENCRYPTION_KEY is ${_key.length} chars. Recommended: 32+ characters for AES-256.`);
    }
    _derivedKey = createHash("sha256").update(_key).digest();
    _legacyKey = Buffer.from(_key.padEnd(32, "0").slice(0, 32));
  }
  return { derivedKey: _derivedKey, legacyKey: _legacyKey! };
}

export function encryptField(text: string): string {
  const { derivedKey } = getKeys();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptField(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !encrypted) {
    console.warn("[SECURITY] decryptField: input not in encrypted format, returning as-is");
    return encryptedText; // Not encrypted (legacy plain text)
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const { derivedKey, legacyKey } = getKeys();

  // Try derived key first, fall back to legacy key for old data
  try {
    const decipher = createDecipheriv("aes-256-gcm", derivedKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Fall back to legacy padded key for data encrypted before the fix
    console.warn("[SECURITY] decryptField: using legacy key fallback — consider re-encrypting data");
    const decipher = createDecipheriv("aes-256-gcm", legacyKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

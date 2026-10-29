import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { Option } from "effect";

import { env } from "@/config/env";

const PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Resolves the configured key, or `null` when encryption is disabled. */
function resolveKey(key?: Buffer): Buffer | null {
  if (key) return key;

  const configured = env.dataEncryptionKey;
  const raw = Option.isSome(configured) ? configured.value.trim() : "";
  if (!raw) return null;

  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }

  return decoded;
}

/**
 * Encrypts candidate text for storage. Without `DATA_ENCRYPTION_KEY` the value
 * is stored as-is, so local development and tests keep working.
 */
export function encryptText(text: string, key?: Buffer): string {
  if (text.startsWith(PREFIX)) return text;

  const resolved = resolveKey(key);
  if (!resolved) return text;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, resolved, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${Buffer.concat([iv, tag, ciphertext]).toString("base64")}`;
}

/** Decrypts a stored value. Plaintext values pass through unchanged. */
export function decryptText(text: string, key?: Buffer): string {
  if (!text.startsWith(PREFIX)) return text;

  const resolved = resolveKey(key);
  if (!resolved) {
    throw new Error("Encrypted data found but DATA_ENCRYPTION_KEY is not set");
  }

  const payload = Buffer.from(text.slice(PREFIX.length), "base64");
  if (payload.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Encrypted value is malformed");
  }

  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, resolved, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Encrypts an optional column value. */
export function encryptOptional(value: string | null | undefined): string | null {
  return value == null ? null : encryptText(value);
}

/** Decrypts an optional column value. */
export function decryptOptional(value: string | null | undefined): string | undefined {
  return value == null ? undefined : decryptText(value);
}

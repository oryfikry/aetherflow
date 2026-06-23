import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

export function getEncryptionKey(env: Record<string, string | undefined> = process.env): Buffer {
  const rawKey = env.PROVIDER_SETTINGS_ENCRYPTION_KEY?.trim();

  if (!rawKey) {
    throw new Error("PROVIDER_SETTINGS_ENCRYPTION_KEY is required");
  }

  const key = Buffer.from(rawKey, "base64url");

  if (key.byteLength !== 32) {
    throw new Error("PROVIDER_SETTINGS_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptSecret(secret: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url")
  ].join(":");
}

export function decryptSecret(encryptedSecret: string, key: Buffer): string {
  const [version, iv, tag, ciphertext] = encryptedSecret.split(":");

  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unsupported encrypted secret format");
  }

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

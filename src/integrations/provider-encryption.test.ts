import { describe, expect, test } from "bun:test";

import { decryptSecret, encryptSecret, getEncryptionKey } from "./provider-encryption";

describe("provider secret encryption", () => {
  const key = getEncryptionKey({
    PROVIDER_SETTINGS_ENCRYPTION_KEY: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE"
  });

  test("encrypts without storing plaintext and decrypts with the same key", () => {
    const encrypted = encryptSecret("sk-test-secret", key);

    expect(encrypted).toStartWith("v1:");
    expect(encrypted).not.toContain("sk-test-secret");
    expect(decryptSecret(encrypted, key)).toBe("sk-test-secret");
  });

  test("requires a 32-byte key", () => {
    expect(() =>
      getEncryptionKey({
        PROVIDER_SETTINGS_ENCRYPTION_KEY: "short"
      })
    ).toThrow("PROVIDER_SETTINGS_ENCRYPTION_KEY must decode to 32 bytes");
  });
});

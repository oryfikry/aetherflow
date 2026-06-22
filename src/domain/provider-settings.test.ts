import { describe, expect, test } from "bun:test";

import {
  DEFAULT_THIRD_PARTY_PROVIDER,
  getProviderDisplayDefaults,
  maskApiKey,
  normalizeProviderSettings
} from "./provider-settings";

describe("DEFAULT_THIRD_PARTY_PROVIDER", () => {
  test("uses the 9Router placeholder without storing a real API key", () => {
    expect(DEFAULT_THIRD_PARTY_PROVIDER).toEqual({
      name: "9Router",
      baseUrl: "https://9router.oryfikry.space/v1",
      apiKey: "",
      chatModel: "combo-orak-arik",
      embeddingModel: "",
      cohereApiKey: "",
      cohereEmbeddingModel: "embed-v4.0",
      cohereInputType: "search_query",
      timeoutMs: 30000
    });
  });
});

describe("maskApiKey", () => {
  test("masks secret values", () => {
    expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-1...cdef");
  });

  test("returns empty string when no key is configured", () => {
    expect(maskApiKey("")).toBe("");
  });
});

describe("normalizeProviderSettings", () => {
  test("trims fields and removes trailing base URL slashes", () => {
    expect(
      normalizeProviderSettings({
        name: "  9Router  ",
        baseUrl: "https://9router.oryfikry.space/v1///",
        apiKey: "  secret  ",
        chatModel: " combo-orak-arik ",
        embeddingModel: " embedding-model ",
        cohereApiKey: " cohere-secret ",
        cohereEmbeddingModel: " embed-v4.0 ",
        cohereInputType: "search_query",
        timeoutMs: 45000
      })
    ).toEqual({
      name: "9Router",
      baseUrl: "https://9router.oryfikry.space/v1",
      apiKey: "secret",
      chatModel: "combo-orak-arik",
      embeddingModel: "embedding-model",
      cohereApiKey: "cohere-secret",
      cohereEmbeddingModel: "embed-v4.0",
      cohereInputType: "search_query",
      timeoutMs: 45000
    });
  });
});

describe("getProviderDisplayDefaults", () => {
  test("returns safe placeholders for the settings UI", () => {
    expect(getProviderDisplayDefaults()).toEqual({
      name: "9Router",
      baseUrl: "https://9router.oryfikry.space/v1",
      apiKeyPlaceholder: "Paste bearer token",
      chatModel: "combo-orak-arik",
      embeddingModel: "Provider embedding model",
      timeoutMs: 30000
    });
  });
});

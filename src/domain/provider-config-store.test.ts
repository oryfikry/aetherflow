import { describe, expect, test } from "bun:test";

import {
  buildProviderSettingsFromEnv,
  updateEnvTextWithProviderSettings
} from "./provider-config-store";

describe("buildProviderSettingsFromEnv", () => {
  test("returns configured flags without exposing secret values", () => {
    const result = buildProviderSettingsFromEnv({
      AI_PROVIDER_NAME: "9Router",
      AI_PROVIDER_BASE_URL: "https://router.example/v1",
      AI_PROVIDER_API_KEY: "secret-chat-key",
      AI_CHAT_MODEL: "combo-orak-arik",
      COHERE_API_KEY: "secret-cohere-key",
      COHERE_EMBEDDING_MODEL: "embed-v4.0",
      COHERE_INPUT_TYPE: "search_query",
      AI_PROVIDER_TIMEOUT_MS: "45000"
    });

    expect(result).toEqual({
      settings: {
        name: "9Router",
        baseUrl: "https://router.example/v1",
        apiKey: "",
        chatModel: "combo-orak-arik",
        embeddingModel: "",
        cohereApiKey: "",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 45000
      },
      configured: {
        apiKey: true,
        cohereApiKey: true
      }
    });
  });
});

describe("updateEnvTextWithProviderSettings", () => {
  test("preserves existing keys when submitted key fields are empty", () => {
    const updated = updateEnvTextWithProviderSettings(
      "AI_PROVIDER_API_KEY=existing-chat\nCOHERE_API_KEY=existing-cohere\n",
      {
        name: "9Router",
        baseUrl: "https://router.example/v1",
        apiKey: "",
        chatModel: "combo-orak-arik",
        embeddingModel: "",
        cohereApiKey: "",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 30000
      }
    );

    expect(updated).toContain("AI_PROVIDER_API_KEY=existing-chat");
    expect(updated).toContain("COHERE_API_KEY=existing-cohere");
    expect(updated).toContain("AI_PROVIDER_BASE_URL=https://router.example/v1");
  });

  test("writes new keys when fields are provided", () => {
    const updated = updateEnvTextWithProviderSettings("", {
      name: "9Router",
      baseUrl: "https://router.example/v1",
      apiKey: "new-chat",
      chatModel: "combo-orak-arik",
      embeddingModel: "",
      cohereApiKey: "new-cohere",
      cohereEmbeddingModel: "embed-v4.0",
      cohereInputType: "search_query",
      timeoutMs: 30000
    });

    expect(updated).toContain("AI_PROVIDER_API_KEY=new-chat");
    expect(updated).toContain("COHERE_API_KEY=new-cohere");
  });
});

import { describe, expect, test } from "bun:test";

import { decryptSecret, getEncryptionKey } from "./provider-encryption";
import {
  loadProviderSettings,
  saveProviderSettings,
  type ProviderSettingsRow,
  type SupabaseProviderSettingsClient
} from "./supabase-provider-settings";

function createFakeClient(initialRow: ProviderSettingsRow | null = null) {
  let row = initialRow;
  const upserts: ProviderSettingsRow[] = [];

  const client: SupabaseProviderSettingsClient = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle: async () => ({
          data: row,
          error: null
        }),
        upsert(value: ProviderSettingsRow) {
          upserts.push(value);
          row = value;

          return {
            select() {
              return this;
            },
            maybeSingle: async () => ({
              data: row,
              error: null
            })
          };
        }
      };
    }
  };

  return { client, upserts };
}

describe("loadProviderSettings", () => {
  test("returns configured flags without exposing encrypted secrets", async () => {
    const key = getEncryptionKey({
      PROVIDER_SETTINGS_ENCRYPTION_KEY: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE"
    });
    const { client } = createFakeClient({
      user_id: "local-dev",
      provider_name: "9Router",
      base_url: "https://router.example/v1",
      api_key_encrypted: "encrypted-chat",
      chat_model: "combo-orak-arik",
      embedding_model: "",
      cohere_api_key_encrypted: "encrypted-cohere",
      cohere_embedding_model: "embed-v4.0",
      cohere_input_type: "search_query",
      timeout_ms: 30000
    });

    await expect(loadProviderSettings(client, "local-dev", key)).resolves.toMatchObject({
      settings: {
        apiKey: "",
        cohereApiKey: ""
      },
      configured: {
        apiKey: true,
        cohereApiKey: true
      }
    });
  });
});

describe("saveProviderSettings", () => {
  test("encrypts submitted secrets before upsert", async () => {
    const key = getEncryptionKey({
      PROVIDER_SETTINGS_ENCRYPTION_KEY: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE"
    });
    const { client, upserts } = createFakeClient();

    await saveProviderSettings(
      client,
      "local-dev",
      {
        name: "9Router",
        baseUrl: "https://router.example/v1",
        apiKey: "chat-secret",
        chatModel: "combo-orak-arik",
        embeddingModel: "",
        cohereApiKey: "cohere-secret",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 30000
      },
      key
    );

    expect(upserts[0].api_key_encrypted).not.toContain("chat-secret");
    expect(decryptSecret(upserts[0].api_key_encrypted ?? "", key)).toBe("chat-secret");
    expect(decryptSecret(upserts[0].cohere_api_key_encrypted ?? "", key)).toBe("cohere-secret");
  });

  test("preserves existing encrypted secrets when submitted fields are blank", async () => {
    const key = getEncryptionKey({
      PROVIDER_SETTINGS_ENCRYPTION_KEY: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE"
    });
    const existingApiKey = "v1:existing:api:key";
    const existingCohereKey = "v1:existing:cohere:key";
    const { client, upserts } = createFakeClient({
      user_id: "local-dev",
      provider_name: "9Router",
      base_url: "https://router.example/v1",
      api_key_encrypted: existingApiKey,
      chat_model: "combo-orak-arik",
      embedding_model: "",
      cohere_api_key_encrypted: existingCohereKey,
      cohere_embedding_model: "embed-v4.0",
      cohere_input_type: "search_query",
      timeout_ms: 30000
    });

    await saveProviderSettings(
      client,
      "local-dev",
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
      },
      key
    );

    expect(upserts[0].api_key_encrypted).toBe(existingApiKey);
    expect(upserts[0].cohere_api_key_encrypted).toBe(existingCohereKey);
  });
});

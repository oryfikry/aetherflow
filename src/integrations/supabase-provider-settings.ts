import { normalizeProviderSettings, type ProviderSettings } from "@/domain/provider-settings";

import { decryptSecret, encryptSecret } from "./provider-encryption";

export const PROVIDER_SETTINGS_TABLE = "provider_settings";

export type ProviderSettingsRow = {
  user_id: string;
  provider_name: string;
  base_url: string;
  api_key_encrypted: string | null;
  chat_model: string;
  embedding_model: string | null;
  cohere_api_key_encrypted: string | null;
  cohere_embedding_model: string;
  cohere_input_type: ProviderSettings["cohereInputType"];
  timeout_ms: number;
};

type QueryResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

type SelectBuilder = {
  select(columns?: string): SelectBuilder;
  eq(column: string, value: string): SelectBuilder;
  maybeSingle(): QueryResult<ProviderSettingsRow>;
  upsert(value: ProviderSettingsRow, options?: { onConflict?: string }): {
    select(columns?: string): {
      maybeSingle(): QueryResult<ProviderSettingsRow>;
    };
  };
};

export type SupabaseProviderSettingsClient = {
  from(table: typeof PROVIDER_SETTINGS_TABLE): SelectBuilder;
};

export type ProviderSettingsSnapshot = {
  settings: ProviderSettings;
  configured: {
    apiKey: boolean;
    cohereApiKey: boolean;
  };
};

export function rowToProviderSettingsSnapshot(row: ProviderSettingsRow): ProviderSettingsSnapshot {
  return {
    settings: {
      name: row.provider_name,
      baseUrl: row.base_url,
      apiKey: "",
      chatModel: row.chat_model,
      embeddingModel: row.embedding_model ?? "",
      cohereApiKey: "",
      cohereEmbeddingModel: row.cohere_embedding_model,
      cohereInputType: row.cohere_input_type,
      timeoutMs: row.timeout_ms
    },
    configured: {
      apiKey: Boolean(row.api_key_encrypted),
      cohereApiKey: Boolean(row.cohere_api_key_encrypted)
    }
  };
}

async function loadProviderSettingsRow(
  client: SupabaseProviderSettingsClient,
  userId: string
): Promise<ProviderSettingsRow | null> {
  const { data, error } = await client
    .from(PROVIDER_SETTINGS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function loadProviderSettings(
  client: SupabaseProviderSettingsClient,
  userId: string,
  _encryptionKey: Buffer
): Promise<ProviderSettingsSnapshot | null> {
  const row = await loadProviderSettingsRow(client, userId);

  return row ? rowToProviderSettingsSnapshot(row) : null;
}

export async function getProviderSettingsWithSecrets(
  client: SupabaseProviderSettingsClient,
  userId: string,
  encryptionKey: Buffer
): Promise<ProviderSettings | null> {
  const row = await loadProviderSettingsRow(client, userId);

  if (!row) {
    return null;
  }

  return normalizeProviderSettings({
    name: row.provider_name,
    baseUrl: row.base_url,
    apiKey: row.api_key_encrypted ? decryptSecret(row.api_key_encrypted, encryptionKey) : "",
    chatModel: row.chat_model,
    embeddingModel: row.embedding_model ?? "",
    cohereApiKey: row.cohere_api_key_encrypted
      ? decryptSecret(row.cohere_api_key_encrypted, encryptionKey)
      : "",
    cohereEmbeddingModel: row.cohere_embedding_model,
    cohereInputType: row.cohere_input_type,
    timeoutMs: row.timeout_ms
  });
}

export async function saveProviderSettings(
  client: SupabaseProviderSettingsClient,
  userId: string,
  settings: ProviderSettings,
  encryptionKey: Buffer
): Promise<ProviderSettingsSnapshot> {
  const provider = normalizeProviderSettings(settings);
  const existingRow = await loadProviderSettingsRow(client, userId);
  const row: ProviderSettingsRow = {
    user_id: userId,
    provider_name: provider.name,
    base_url: provider.baseUrl,
    api_key_encrypted: provider.apiKey
      ? encryptSecret(provider.apiKey, encryptionKey)
      : existingRow?.api_key_encrypted ?? null,
    chat_model: provider.chatModel,
    embedding_model: provider.embeddingModel || null,
    cohere_api_key_encrypted: provider.cohereApiKey
      ? encryptSecret(provider.cohereApiKey, encryptionKey)
      : existingRow?.cohere_api_key_encrypted ?? null,
    cohere_embedding_model: provider.cohereEmbeddingModel,
    cohere_input_type: provider.cohereInputType,
    timeout_ms: provider.timeoutMs
  };

  const { data, error } = await client
    .from(PROVIDER_SETTINGS_TABLE)
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Supabase did not return saved provider settings");
  }

  return rowToProviderSettingsSnapshot(data);
}

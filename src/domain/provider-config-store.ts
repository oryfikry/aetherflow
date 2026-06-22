import {
  DEFAULT_THIRD_PARTY_PROVIDER,
  normalizeProviderSettings,
  type ProviderSettings
} from "./provider-settings";

export type ProviderKeyState = {
  apiKey: boolean;
  cohereApiKey: boolean;
};

export type ProviderSettingsSnapshot = {
  settings: ProviderSettings;
  configured: ProviderKeyState;
};

type ProviderEnv = Record<string, string | undefined>;

const validCohereInputTypes: ProviderSettings["cohereInputType"][] = [
  "search_query",
  "search_document",
  "classification",
  "clustering"
];

const coerceCohereInputType = (value: string | undefined): ProviderSettings["cohereInputType"] =>
  validCohereInputTypes.includes(value as ProviderSettings["cohereInputType"])
    ? (value as ProviderSettings["cohereInputType"])
    : DEFAULT_THIRD_PARTY_PROVIDER.cohereInputType;

const coerceTimeoutMs = (value: string | undefined) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_THIRD_PARTY_PROVIDER.timeoutMs;
};

export function buildProviderSettingsFromEnv(env: ProviderEnv): ProviderSettingsSnapshot {
  return {
    settings: {
      name: env.AI_PROVIDER_NAME ?? DEFAULT_THIRD_PARTY_PROVIDER.name,
      baseUrl: env.AI_PROVIDER_BASE_URL ?? DEFAULT_THIRD_PARTY_PROVIDER.baseUrl,
      apiKey: "",
      chatModel: env.AI_CHAT_MODEL ?? DEFAULT_THIRD_PARTY_PROVIDER.chatModel,
      embeddingModel: env.AI_EMBEDDING_MODEL ?? DEFAULT_THIRD_PARTY_PROVIDER.embeddingModel,
      cohereApiKey: "",
      cohereEmbeddingModel:
        env.COHERE_EMBEDDING_MODEL ?? DEFAULT_THIRD_PARTY_PROVIDER.cohereEmbeddingModel,
      cohereInputType: coerceCohereInputType(env.COHERE_INPUT_TYPE),
      timeoutMs: coerceTimeoutMs(env.AI_PROVIDER_TIMEOUT_MS)
    },
    configured: {
      apiKey: Boolean(env.AI_PROVIDER_API_KEY?.trim()),
      cohereApiKey: Boolean(env.COHERE_API_KEY?.trim())
    }
  };
}

const upsertEnvValue = (envText: string, key: string, value: string) => {
  const lines = envText.split(/\r?\n/);
  const matcher = new RegExp(`^${key}=`);
  let replaced = false;

  const updatedLines = lines.map((line) => {
    if (matcher.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }

    return line;
  });

  if (!replaced) {
    const needsLeadingBreak = updatedLines.length > 0 && updatedLines.at(-1) !== "";
    updatedLines.push(`${needsLeadingBreak ? "\n" : ""}${key}=${value}`);
  }

  return updatedLines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
};

const readEnvValue = (envText: string, key: string) => {
  const line = envText.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));

  return line?.slice(key.length + 1) ?? "";
};

export function updateEnvTextWithProviderSettings(
  envText: string,
  settings: ProviderSettings
): string {
  const provider = normalizeProviderSettings(settings);
  const updates: Record<string, string> = {
    AI_PROVIDER_NAME: provider.name,
    AI_PROVIDER_BASE_URL: provider.baseUrl,
    AI_CHAT_MODEL: provider.chatModel,
    AI_PROVIDER_TIMEOUT_MS: String(provider.timeoutMs),
    AI_EMBEDDING_PROVIDER: "cohere",
    COHERE_EMBEDDING_MODEL: provider.cohereEmbeddingModel,
    COHERE_INPUT_TYPE: provider.cohereInputType
  };

  if (provider.embeddingModel) {
    updates.AI_EMBEDDING_MODEL = provider.embeddingModel;
  }

  updates.AI_PROVIDER_API_KEY =
    provider.apiKey || readEnvValue(envText, "AI_PROVIDER_API_KEY");
  updates.COHERE_API_KEY = provider.cohereApiKey || readEnvValue(envText, "COHERE_API_KEY");

  return Object.entries(updates).reduce(
    (currentText, [key, value]) => upsertEnvValue(currentText, key, value),
    envText
  );
}

export function mergeProviderWithExistingKeys(
  settings: ProviderSettings,
  env: ProviderEnv
): ProviderSettings {
  return normalizeProviderSettings({
    ...settings,
    apiKey: settings.apiKey.trim() || env.AI_PROVIDER_API_KEY || "",
    cohereApiKey: settings.cohereApiKey.trim() || env.COHERE_API_KEY || ""
  });
}

export function applyProviderSettingsToProcessEnv(settings: ProviderSettings) {
  const provider = normalizeProviderSettings(settings);

  process.env.AI_PROVIDER_NAME = provider.name;
  process.env.AI_PROVIDER_BASE_URL = provider.baseUrl;
  process.env.AI_CHAT_MODEL = provider.chatModel;
  process.env.AI_PROVIDER_TIMEOUT_MS = String(provider.timeoutMs);
  process.env.AI_EMBEDDING_PROVIDER = "cohere";
  process.env.COHERE_EMBEDDING_MODEL = provider.cohereEmbeddingModel;
  process.env.COHERE_INPUT_TYPE = provider.cohereInputType;

  if (provider.embeddingModel) {
    process.env.AI_EMBEDDING_MODEL = provider.embeddingModel;
  }

  if (provider.apiKey) {
    process.env.AI_PROVIDER_API_KEY = provider.apiKey;
  }

  if (provider.cohereApiKey) {
    process.env.COHERE_API_KEY = provider.cohereApiKey;
  }
}

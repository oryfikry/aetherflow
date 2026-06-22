export type ProviderSettings = {
  name: string;
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  cohereApiKey: string;
  cohereEmbeddingModel: string;
  cohereInputType: "search_query" | "search_document" | "classification" | "clustering";
  timeoutMs: number;
};

export type ProviderDisplayDefaults = Pick<
  ProviderSettings,
  "name" | "baseUrl" | "chatModel" | "timeoutMs"
> & {
  apiKeyPlaceholder: string;
  embeddingModel: string;
};

export const DEFAULT_THIRD_PARTY_PROVIDER: ProviderSettings = {
  name: "9Router",
  baseUrl: "https://9router.oryfikry.space/v1",
  apiKey: "",
  chatModel: "combo-orak-arik",
  embeddingModel: "",
  cohereApiKey: "",
  cohereEmbeddingModel: "embed-v4.0",
  cohereInputType: "search_query",
  timeoutMs: 30000
};

export function normalizeProviderBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function maskApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= 8) {
    return "••••";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function normalizeProviderSettings(settings: ProviderSettings): ProviderSettings {
  return {
    name: settings.name.trim(),
    baseUrl: normalizeProviderBaseUrl(settings.baseUrl),
    apiKey: settings.apiKey.trim(),
    chatModel: settings.chatModel.trim(),
    embeddingModel: settings.embeddingModel.trim(),
    cohereApiKey: settings.cohereApiKey.trim(),
    cohereEmbeddingModel: settings.cohereEmbeddingModel.trim(),
    cohereInputType: settings.cohereInputType,
    timeoutMs: settings.timeoutMs
  };
}

export function getProviderDisplayDefaults(): ProviderDisplayDefaults {
  return {
    name: DEFAULT_THIRD_PARTY_PROVIDER.name,
    baseUrl: DEFAULT_THIRD_PARTY_PROVIDER.baseUrl,
    apiKeyPlaceholder: "Paste bearer token",
    chatModel: DEFAULT_THIRD_PARTY_PROVIDER.chatModel,
    embeddingModel: "Provider embedding model",
    timeoutMs: DEFAULT_THIRD_PARTY_PROVIDER.timeoutMs
  };
}

import { DEFAULT_THIRD_PARTY_PROVIDER } from "@/domain/provider-settings";

export type EmbeddingProviderConfig = {
  name: string;
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingProvider: "openai-compatible" | "cohere";
  embeddingModel: string;
  cohereApiKey: string;
  cohereBaseUrl: string;
  cohereEmbeddingModel: string;
  cohereInputType: "search_query" | "search_document" | "classification" | "clustering";
  timeoutMs: number;
};

export type CreateEmbeddingInput = {
  input: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CreateChatCompletionInput = {
  messages: ChatMessage[];
};

export type EmbeddingResult = {
  embedding: number[];
  model?: string;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

export type ChatCompletionResult = {
  content: string;
  model?: string;
};

type EmbeddingProviderResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

type CohereEmbeddingProviderResponse = {
  embeddings?:
    | number[][]
    | {
        float?: number[][];
      };
  model?: string;
  message?: string;
};

type ChatCompletionProviderResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  model?: string;
  error?: {
    message?: string;
  };
};

export function normalizeProviderBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

export function getEmbeddingProviderConfig(
  env: NodeJS.ProcessEnv = process.env
): EmbeddingProviderConfig {
  const baseUrl = normalizeProviderBaseUrl(
    env.AI_PROVIDER_BASE_URL?.trim() || DEFAULT_THIRD_PARTY_PROVIDER.baseUrl
  );
  const name = env.AI_PROVIDER_NAME?.trim() || DEFAULT_THIRD_PARTY_PROVIDER.name;
  const apiKey = env.AI_PROVIDER_API_KEY?.trim();
  const chatModel = env.AI_CHAT_MODEL?.trim() || DEFAULT_THIRD_PARTY_PROVIDER.chatModel;
  const embeddingProvider =
    env.AI_EMBEDDING_PROVIDER?.trim() === "cohere" ? "cohere" : "openai-compatible";
  const embeddingModel =
    env.AI_EMBEDDING_MODEL?.trim() || DEFAULT_THIRD_PARTY_PROVIDER.embeddingModel;
  const cohereApiKey = env.COHERE_API_KEY?.trim() || "";
  const cohereBaseUrl = normalizeProviderBaseUrl(
    env.COHERE_BASE_URL?.trim() || "https://api.cohere.com/v1"
  );
  const cohereEmbeddingModel = env.COHERE_EMBEDDING_MODEL?.trim() || "embed-v4.0";
  const cohereInputType =
    (env.COHERE_INPUT_TYPE?.trim() as EmbeddingProviderConfig["cohereInputType"]) ||
    "search_query";
  const timeoutMs = Number(env.AI_PROVIDER_TIMEOUT_MS ?? DEFAULT_THIRD_PARTY_PROVIDER.timeoutMs);

  if (embeddingProvider === "openai-compatible" && !apiKey) {
    throw new Error("AI_PROVIDER_API_KEY is required");
  }

  if (embeddingProvider === "cohere" && !cohereApiKey) {
    throw new Error("COHERE_API_KEY is required");
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("AI_PROVIDER_TIMEOUT_MS must be a positive number");
  }

  return {
    name,
    baseUrl,
    apiKey: apiKey || "",
    chatModel,
    embeddingProvider,
    embeddingModel,
    cohereApiKey,
    cohereBaseUrl,
    cohereEmbeddingModel,
    cohereInputType,
    timeoutMs
  };
}

export async function createEmbedding(
  input: CreateEmbeddingInput,
  config = getEmbeddingProviderConfig(),
  fetchImpl: typeof fetch = fetch
): Promise<EmbeddingResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    if (config.embeddingProvider === "cohere") {
      const response = await fetchImpl(`${config.cohereBaseUrl}/embed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.cohereApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.cohereEmbeddingModel,
          texts: [input.input],
          input_type: config.cohereInputType,
          embedding_types: ["float"]
        }),
        signal: controller.signal
      });

      const payload = (await response.json().catch(() => ({}))) as CohereEmbeddingProviderResponse;

      if (!response.ok) {
        const message = payload.message || response.statusText || "unknown error";

        throw new Error(`Cohere embedding request failed with status ${response.status}: ${message}`);
      }

      const embedding = Array.isArray(payload.embeddings)
        ? payload.embeddings[0]
        : payload.embeddings?.float?.[0];

      if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== "number")) {
        throw new Error("Cohere returned an invalid embedding response");
      }

      return {
        embedding,
        model: payload.model
      };
    }

    const response = await fetchImpl(`${config.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.embeddingModel,
        input: input.input,
        encoding_format: "float"
      }),
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => ({}))) as EmbeddingProviderResponse;

    if (!response.ok) {
      const message = payload.error?.message || response.statusText || "unknown error";

      throw new Error(
        `Embedding provider request failed with status ${response.status}: ${message}`
      );
    }

    const embedding = payload.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== "number")) {
      throw new Error("Embedding provider returned an invalid embedding response");
    }

    return {
      embedding,
      model: payload.model,
      usage: payload.usage
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Embedding provider request timed out after ${config.timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createChatCompletion(
  input: CreateChatCompletionInput,
  config = getEmbeddingProviderConfig(),
  fetchImpl: typeof fetch = fetch
): Promise<ChatCompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.chatModel,
        messages: input.messages,
        stream: false
      }),
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => ({}))) as ChatCompletionProviderResponse;

    if (!response.ok) {
      const message = payload.error?.message || response.statusText || "unknown error";

      throw new Error(`Chat provider request failed with status ${response.status}: ${message}`);
    }

    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      throw new Error("Chat provider returned an invalid completion response");
    }

    return {
      content,
      model: payload.model
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Chat provider request timed out after ${config.timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

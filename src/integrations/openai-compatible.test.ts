import { describe, expect, test } from "bun:test";

import {
  createChatCompletion,
  createEmbedding,
  getEmbeddingProviderConfig,
  normalizeProviderBaseUrl
} from "./openai-compatible";

describe("getEmbeddingProviderConfig", () => {
  test("reads OpenAI-compatible embedding provider env", () => {
    const config = getEmbeddingProviderConfig({
      AI_EMBEDDING_PROVIDER: "openai-compatible",
      AI_PROVIDER_BASE_URL: "https://api.example.com/v1/",
      AI_PROVIDER_API_KEY: "test-key",
      AI_EMBEDDING_MODEL: "embedding-model"
    });

    expect(config).toEqual({
      name: "9Router",
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      chatModel: "combo-orak-arik",
      embeddingProvider: "openai-compatible",
      embeddingModel: "embedding-model",
      cohereApiKey: "",
      cohereBaseUrl: "https://api.cohere.com/v1",
      cohereEmbeddingModel: "embed-v4.0",
      cohereInputType: "search_query",
      timeoutMs: 30000
    });
  });

  test("reads Cohere embedding provider env without requiring the chat provider key", () => {
    const config = getEmbeddingProviderConfig({
      AI_EMBEDDING_PROVIDER: "cohere",
      COHERE_API_KEY: "cohere-key",
      COHERE_EMBEDDING_MODEL: "embed-v4.0"
    });

    expect(config).toMatchObject({
      embeddingProvider: "cohere",
      cohereApiKey: "cohere-key",
      cohereBaseUrl: "https://api.cohere.com/v1",
      cohereEmbeddingModel: "embed-v4.0",
      cohereInputType: "search_query"
    });
  });

  test("throws a readable error when API key is missing", () => {
    expect(() =>
      getEmbeddingProviderConfig({
        AI_EMBEDDING_PROVIDER: "openai-compatible",
        AI_PROVIDER_BASE_URL: "https://api.example.com/v1",
        AI_EMBEDDING_MODEL: "embedding-model"
      })
    ).toThrow("AI_PROVIDER_API_KEY is required");
  });

  test("throws a readable error when Cohere API key is missing", () => {
    expect(() =>
      getEmbeddingProviderConfig({
        AI_EMBEDDING_PROVIDER: "cohere"
      })
    ).toThrow("COHERE_API_KEY is required");
  });
});

describe("normalizeProviderBaseUrl", () => {
  test("removes trailing slashes", () => {
    expect(normalizeProviderBaseUrl("https://api.example.com/v1///")).toBe(
      "https://api.example.com/v1"
    );
  });
});

describe("createEmbedding", () => {
  test("posts to the OpenAI-compatible embeddings endpoint", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });

      return new Response(
        JSON.stringify({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
          model: "embedding-model",
          usage: { prompt_tokens: 4, total_tokens: 4 }
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    };

    const result = await createEmbedding(
      {
        input: "Ethereum trend report"
      },
      {
        baseUrl: "https://api.example.com/v1",
        name: "9Router",
        apiKey: "test-key",
        chatModel: "combo-orak-arik",
        embeddingProvider: "openai-compatible",
        embeddingModel: "embedding-model",
        cohereApiKey: "",
        cohereBaseUrl: "https://api.cohere.com/v1",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 30000
      },
      fetchImpl
    );

    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(result.model).toBe("embedding-model");
    expect(requests[0].url).toBe("https://api.example.com/v1/embeddings");
    expect(requests[0].init.method).toBe("POST");
    expect(requests[0].init.headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json"
    });
    expect(JSON.parse(String(requests[0].init.body))).toEqual({
      model: "embedding-model",
      input: "Ethereum trend report",
      encoding_format: "float"
    });
  });

  test("throws a readable error for provider failures", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ error: { message: "bad key" } }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });

    await expect(
      createEmbedding(
        {
          input: "Ethereum trend report"
        },
        {
          baseUrl: "https://api.example.com/v1",
          name: "9Router",
          apiKey: "test-key",
          chatModel: "combo-orak-arik",
          embeddingProvider: "openai-compatible",
          embeddingModel: "embedding-model",
          cohereApiKey: "",
          cohereBaseUrl: "https://api.cohere.com/v1",
          cohereEmbeddingModel: "embed-v4.0",
          cohereInputType: "search_query",
          timeoutMs: 30000
        },
        fetchImpl
      )
    ).rejects.toThrow("Embedding provider request failed with status 401: bad key");
  });

  test("posts to Cohere embed endpoint when selected", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });

      return new Response(
        JSON.stringify({
          embeddings: {
            float: [[0.4, 0.5, 0.6]]
          },
          model: "embed-v4.0"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    };

    const result = await createEmbedding(
      {
        input: "Ethereum trend report"
      },
      {
        name: "9Router",
        baseUrl: "https://9router.oryfikry.space/v1",
        apiKey: "",
        chatModel: "combo-orak-arik",
        embeddingProvider: "cohere",
        embeddingModel: "",
        cohereApiKey: "cohere-key",
        cohereBaseUrl: "https://api.cohere.com/v1",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 30000
      },
      fetchImpl
    );

    expect(result.embedding).toEqual([0.4, 0.5, 0.6]);
    expect(requests[0].url).toBe("https://api.cohere.com/v1/embed");
    expect(requests[0].init.headers).toEqual({
      Authorization: "Bearer cohere-key",
      "Content-Type": "application/json"
    });
    expect(JSON.parse(String(requests[0].init.body))).toEqual({
      model: "embed-v4.0",
      texts: ["Ethereum trend report"],
      input_type: "search_query",
      embedding_types: ["float"]
    });
  });
});

describe("createChatCompletion", () => {
  test("posts to the OpenAI-compatible chat completions endpoint", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: "I am combo-orak-arik."
              }
            }
          ],
          model: "combo-orak-arik"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    };

    const result = await createChatCompletion(
      {
        messages: [{ role: "user", content: "hi what model are you?" }]
      },
      {
        name: "9Router",
        baseUrl: "https://9router.oryfikry.space/v1",
        apiKey: "test-key",
        chatModel: "combo-orak-arik",
        embeddingProvider: "cohere",
        embeddingModel: "",
        cohereApiKey: "cohere-key",
        cohereBaseUrl: "https://api.cohere.com/v1",
        cohereEmbeddingModel: "embed-v4.0",
        cohereInputType: "search_query",
        timeoutMs: 30000
      },
      fetchImpl
    );

    expect(result.content).toBe("I am combo-orak-arik.");
    expect(requests[0].url).toBe("https://9router.oryfikry.space/v1/chat/completions");
    expect(JSON.parse(String(requests[0].init.body))).toEqual({
      model: "combo-orak-arik",
      messages: [{ role: "user", content: "hi what model are you?" }],
      stream: false
    });
  });
});

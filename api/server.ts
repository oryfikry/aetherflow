import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";

import { buildAllowedOrigins } from "../src/api/cors";
import {
  buildProviderSettingsFromEnv,
  mergeProviderWithExistingKeys
} from "../src/domain/provider-config-store";
import { planAutomation } from "../src/domain/planner";
import { normalizeProviderSettings, type ProviderSettings } from "../src/domain/provider-settings";
import { generateReportPreview } from "../src/domain/report";
import { createChatCompletion, createEmbedding } from "../src/integrations/openai-compatible";
import { getEncryptionKey } from "../src/integrations/provider-encryption";
import {
  buildPineconeRecord,
  describePineconeIndex,
  queryPineconeByVector,
  upsertPineconeRecords,
  type PineconeSourceType
} from "../src/integrations/pinecone";
import { getSupabaseServiceClient } from "../src/integrations/supabase";
import {
  getProviderSettingsWithSecrets,
  loadProviderSettings,
  saveProviderSettings
} from "../src/integrations/supabase-provider-settings";

const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = buildAllowedOrigins(process.env);
const fallbackProviderSettingsUserId = process.env.PROVIDER_SETTINGS_USER_ID ?? "local-dev";

const providerSettingsBody = t.Object({
  name: t.String({ minLength: 1 }),
  baseUrl: t.String({ minLength: 1 }),
  apiKey: t.String(),
  chatModel: t.String({ minLength: 1 }),
  embeddingModel: t.Optional(t.String()),
  cohereApiKey: t.Optional(t.String()),
  cohereEmbeddingModel: t.Optional(t.String()),
  cohereInputType: t.Optional(
    t.Union([
      t.Literal("search_query"),
      t.Literal("search_document"),
      t.Literal("classification"),
      t.Literal("clustering")
    ])
  ),
  timeoutMs: t.Number({ minimum: 1 })
});

const fallbackProviderSnapshot = () => buildProviderSettingsFromEnv(process.env);

const isMissingProviderSettingsTableError = (error: unknown) =>
  error instanceof Error && /provider_settings|schema cache|does not exist/i.test(error.message);

const getProviderSettingsUserId = async (request: Request) => {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token || token === authorization) {
    return fallbackProviderSettingsUserId;
  }

  const { data, error } = await getSupabaseServiceClient().auth.getUser(token);

  if (error || !data.user?.id) {
    throw new Error("Unauthorized");
  }

  return data.user.id;
};

const loadSavedProviderSettings = async (userId: string) => {
  try {
    return await loadProviderSettings(
      getSupabaseServiceClient(),
      userId,
      getEncryptionKey()
    );
  } catch (error) {
    if (isMissingProviderSettingsTableError(error)) {
      return null;
    }

    throw error;
  }
};

const getProviderSettingsForRequest = async (settings: ProviderSettings, userId: string) => {
  try {
    const savedProvider = await getProviderSettingsWithSecrets(
      getSupabaseServiceClient(),
      userId,
      getEncryptionKey()
    );

    if (savedProvider) {
      return normalizeProviderSettings({
        ...settings,
        apiKey: settings.apiKey.trim() || savedProvider.apiKey,
        cohereApiKey: settings.cohereApiKey.trim() || savedProvider.cohereApiKey
      });
    }
  } catch (error) {
    if (!isMissingProviderSettingsTableError(error)) {
      throw error;
    }
  }

  return mergeProviderWithExistingKeys(settings, process.env);
};

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  )
  .get("/health", () => ({
    ok: true,
    service: "aetherflow-api"
  }))
  .get("/api/providers/settings", async ({ request, set }) => {
    try {
      const userId = await getProviderSettingsUserId(request);
      const savedProvider = await loadSavedProviderSettings(userId);

      return savedProvider ?? fallbackProviderSnapshot();
    } catch (error) {
      set.status = error instanceof Error && error.message === "Unauthorized" ? 401 : 503;

      return {
        error: error instanceof Error ? error.message : "Unable to load provider settings"
      };
    }
  })
  .post(
    "/api/providers/settings",
    async ({ body, request, set }) => {
      try {
        const userId = await getProviderSettingsUserId(request);
        const provider = normalizeProviderSettings({
          name: body.name,
          baseUrl: body.baseUrl,
          apiKey: body.apiKey,
          chatModel: body.chatModel,
          embeddingModel: body.embeddingModel ?? "",
          cohereApiKey: body.cohereApiKey ?? "",
          cohereEmbeddingModel: body.cohereEmbeddingModel ?? "embed-v4.0",
          cohereInputType: body.cohereInputType ?? "search_query",
          timeoutMs: body.timeoutMs
        });

        return await saveProviderSettings(
          getSupabaseServiceClient(),
          userId,
          provider,
          getEncryptionKey()
        );
      } catch (error) {
        set.status =
          error instanceof Error && error.message === "Unauthorized"
            ? 401
            : isMissingProviderSettingsTableError(error)
              ? 424
              : 503;

        return {
          error: isMissingProviderSettingsTableError(error)
            ? "Supabase table public.provider_settings is missing. Run docs/supabase-provider-settings.sql in the Supabase SQL editor."
            : error instanceof Error
              ? error.message
              : "Unable to save provider settings"
        };
      }
    },
    {
      body: providerSettingsBody
    }
  )
  .get("/api/rag/health", async ({ set }) => {
    try {
      const index = await describePineconeIndex();

      return {
        ok: true,
        index: {
          name: index.name,
          dimension: index.dimension,
          metric: index.metric,
          status: index.status
        }
      };
    } catch (error) {
      set.status = 503;

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to reach Pinecone"
      };
    }
  })
  .post(
    "/api/skills/suggest",
    ({ body }) => planAutomation(body.prompt),
    {
      body: t.Object({
        prompt: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    "/api/reports/preview",
    ({ body }) =>
      generateReportPreview({
        prompt: body.prompt,
        topic: body.topic
      }),
    {
      body: t.Object({
        prompt: t.String({ minLength: 1 }),
        topic: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    "/api/embeddings",
    async ({ body, set }) => {
      try {
        return await createEmbedding({
          input: body.input
        });
      } catch (error) {
        set.status = 503;

        return {
          embedding: [],
          error: error instanceof Error ? error.message : "Unable to create embedding"
        };
      }
    },
    {
      body: t.Object({
        input: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    "/api/chat/test",
    async ({ body, set }) => {
      try {
        return await createChatCompletion({
          messages: [
            {
              role: "user",
              content: body.message
            }
          ]
        });
      } catch (error) {
        set.status = 503;

        return {
          content: "",
          error: error instanceof Error ? error.message : "Unable to test chat provider"
        };
      }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 })
      })
    }
  )
  .post(
    "/api/providers/test",
    async ({ body, request, set }) => {
      try {
        const userId = await getProviderSettingsUserId(request);
        const provider = await getProviderSettingsForRequest({
          name: body.provider.name,
          baseUrl: body.provider.baseUrl,
          apiKey: body.provider.apiKey,
          chatModel: body.provider.chatModel,
          embeddingModel: body.provider.embeddingModel ?? "",
          cohereApiKey: body.provider.cohereApiKey ?? "",
          cohereEmbeddingModel: body.provider.cohereEmbeddingModel ?? "embed-v4.0",
          cohereInputType: body.provider.cohereInputType ?? "search_query",
          timeoutMs: body.provider.timeoutMs
        }, userId);

        if (!provider.apiKey) {
          set.status = 422;

          return {
            type: "validation",
            property: "/provider/apiKey",
            summary: "API key is required",
            message: "API key is required"
          };
        }

        return await createChatCompletion(
          {
            messages: [
              {
                role: "user",
                content: body.message
              }
            ]
          },
          {
            name: provider.name,
            baseUrl: provider.baseUrl,
            apiKey: provider.apiKey,
            chatModel: provider.chatModel,
            embeddingProvider: "cohere",
            embeddingModel: provider.embeddingModel,
            cohereApiKey: provider.cohereApiKey,
            cohereBaseUrl: "https://api.cohere.com/v1",
            cohereEmbeddingModel: provider.cohereEmbeddingModel,
            cohereInputType: provider.cohereInputType,
            timeoutMs: provider.timeoutMs
          }
        );
      } catch (error) {
        set.status = error instanceof Error && error.message === "Unauthorized" ? 401 : 503;

        return {
          content: "",
          error: error instanceof Error ? error.message : "Unable to test provider"
        };
      }
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        provider: providerSettingsBody
      })
    }
  )
  .post(
    "/api/rag/query",
    async ({ body, set }) => {
      try {
        return await queryPineconeByVector({
          userId: body.userId,
          vector: body.vector,
          topK: body.topK,
          filter: body.filter
        });
      } catch (error) {
        set.status = 503;

        return {
          matches: [],
          error: error instanceof Error ? error.message : "Unable to query Pinecone"
        };
      }
    },
    {
      body: t.Object({
        userId: t.String({ minLength: 1 }),
        vector: t.Array(t.Number(), { minItems: 1 }),
        topK: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
        filter: t.Optional(t.Record(t.String(), t.Unknown()))
      })
    }
  )
  .post(
    "/api/rag/search-text",
    async ({ body, set }) => {
      try {
        const embedding = await createEmbedding({
          input: body.query
        });

        return await queryPineconeByVector({
          userId: body.userId,
          vector: embedding.embedding,
          topK: body.topK,
          filter: body.filter
        });
      } catch (error) {
        set.status = 503;

        return {
          matches: [],
          error: error instanceof Error ? error.message : "Unable to search RAG memory"
        };
      }
    },
    {
      body: t.Object({
        userId: t.String({ minLength: 1 }),
        query: t.String({ minLength: 1 }),
        topK: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
        filter: t.Optional(t.Record(t.String(), t.Unknown()))
      })
    }
  )
  .post(
    "/api/rag/upsert",
    async ({ body, set }) => {
      try {
        const records = body.records.map((record) =>
          buildPineconeRecord({
            ...record,
            sourceType: record.sourceType as PineconeSourceType
          })
        );

        return await upsertPineconeRecords({
          userId: body.userId,
          records
        });
      } catch (error) {
        set.status = 503;

        return {
          upsertedCount: 0,
          error: error instanceof Error ? error.message : "Unable to upsert Pinecone records"
        };
      }
    },
    {
      body: t.Object({
        userId: t.String({ minLength: 1 }),
        records: t.Array(
          t.Object({
            id: t.String({ minLength: 1 }),
            values: t.Array(t.Number(), { minItems: 1 }),
            userId: t.String({ minLength: 1 }),
            automationId: t.Optional(t.String()),
            runId: t.Optional(t.String()),
            knowledgeSourceId: t.String({ minLength: 1 }),
            sourceType: t.Union([
              t.Literal("upload"),
              t.Literal("url"),
              t.Literal("saved_report"),
              t.Literal("web_snapshot"),
              t.Literal("manual_note")
            ]),
            title: t.String({ minLength: 1 }),
            url: t.Optional(t.String()),
            contentPreview: t.String(),
            chunkRef: t.String({ minLength: 1 }),
            createdAt: t.String({ minLength: 1 })
          }),
          { minItems: 1 }
        )
      })
    }
  )
  .listen(port);

console.log(`AetherFlow API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;

import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import { readFile, writeFile } from "node:fs/promises";

import { buildAllowedOrigins } from "../src/api/cors";
import {
  applyProviderSettingsToProcessEnv,
  buildProviderSettingsFromEnv,
  mergeProviderWithExistingKeys,
  updateEnvTextWithProviderSettings
} from "../src/domain/provider-config-store";
import { planAutomation } from "../src/domain/planner";
import { normalizeProviderSettings } from "../src/domain/provider-settings";
import { generateReportPreview } from "../src/domain/report";
import { createChatCompletion, createEmbedding } from "../src/integrations/openai-compatible";
import {
  buildPineconeRecord,
  describePineconeIndex,
  queryPineconeByVector,
  upsertPineconeRecords,
  type PineconeSourceType
} from "../src/integrations/pinecone";

const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = buildAllowedOrigins(process.env);
const envFileUrl = new URL("../.env", import.meta.url);

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

const readEnvFile = async () => {
  try {
    return await readFile(envFileUrl, "utf8");
  } catch {
    return "";
  }
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
  .get("/api/providers/settings", () => buildProviderSettingsFromEnv(process.env))
  .post(
    "/api/providers/settings",
    async ({ body, set }) => {
      try {
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
        const envText = await readEnvFile();
        const updatedEnvText = updateEnvTextWithProviderSettings(envText, provider);
        const mergedProvider = mergeProviderWithExistingKeys(provider, process.env);

        await writeFile(envFileUrl, updatedEnvText, "utf8");
        applyProviderSettingsToProcessEnv(mergedProvider);

        return buildProviderSettingsFromEnv(process.env);
      } catch (error) {
        set.status = 503;

        return {
          error: error instanceof Error ? error.message : "Unable to save provider settings"
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
    async ({ body, set }) => {
      try {
        const provider = mergeProviderWithExistingKeys({
          name: body.provider.name,
          baseUrl: body.provider.baseUrl,
          apiKey: body.provider.apiKey,
          chatModel: body.provider.chatModel,
          embeddingModel: body.provider.embeddingModel ?? "",
          cohereApiKey: body.provider.cohereApiKey ?? "",
          cohereEmbeddingModel: body.provider.cohereEmbeddingModel ?? "embed-v4.0",
          cohereInputType: body.provider.cohereInputType ?? "search_query",
          timeoutMs: body.provider.timeoutMs
        }, process.env);

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
        set.status = 503;

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

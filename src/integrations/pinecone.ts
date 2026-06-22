import { Pinecone } from "@pinecone-database/pinecone";

export type PineconeConfig = {
  apiKey: string;
  indexName: string;
};

export type PineconeSourceType =
  | "upload"
  | "url"
  | "saved_report"
  | "web_snapshot"
  | "manual_note";

export type PineconeMetadata = {
  userId: string;
  automationId?: string;
  runId?: string;
  knowledgeSourceId: string;
  sourceType: PineconeSourceType;
  title: string;
  url?: string;
  contentPreview: string;
  chunkRef: string;
  createdAt: string;
};

export type PineconeVectorRecord = {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
};

export type BuildPineconeRecordInput = PineconeMetadata & {
  id: string;
  values: number[];
  fullChunkText?: string;
};

export type PineconeFilter = Record<string, unknown>;

export function getPineconeConfig(env: NodeJS.ProcessEnv = process.env): PineconeConfig {
  const apiKey = env.PINECONE_API_KEY?.trim();
  const indexName = env.PINECONE_INDEX_NAME?.trim() || "aetherflow-rag";

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is required");
  }

  return {
    apiKey,
    indexName
  };
}

export function getUserNamespace(userId: string): string {
  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    throw new Error("userId is required");
  }

  return `user:${trimmedUserId}`;
}

export function createPineconeClient(config = getPineconeConfig()) {
  return new Pinecone({
    apiKey: config.apiKey
  });
}

export function buildPineconeRecord(input: BuildPineconeRecordInput): PineconeVectorRecord {
  return {
    id: input.id,
    values: input.values,
    metadata: {
      userId: input.userId,
      automationId: input.automationId,
      runId: input.runId,
      knowledgeSourceId: input.knowledgeSourceId,
      sourceType: input.sourceType,
      title: input.title,
      url: input.url,
      contentPreview: input.contentPreview,
      chunkRef: input.chunkRef,
      createdAt: input.createdAt
    }
  };
}

export function sanitizePineconeFilter(userId: string, filter?: PineconeFilter): PineconeFilter {
  const userFilter = {
    userId: {
      $eq: userId
    }
  };

  if (!filter || Object.keys(filter).length === 0) {
    return userFilter;
  }

  return {
    $and: [userFilter, filter]
  };
}

export async function describePineconeIndex() {
  const config = getPineconeConfig();
  const client = createPineconeClient(config);

  return client.describeIndex(config.indexName);
}

export async function queryPineconeByVector(input: {
  userId: string;
  vector: number[];
  topK?: number;
  filter?: PineconeFilter;
}) {
  const config = getPineconeConfig();
  const client = createPineconeClient(config);
  const indexModel = await client.describeIndex(config.indexName);
  const index = client.index({ host: indexModel.host });

  return index.query({
    vector: input.vector,
    topK: input.topK ?? 5,
    includeMetadata: true,
    includeValues: false,
    namespace: getUserNamespace(input.userId),
    filter: sanitizePineconeFilter(input.userId, input.filter)
  });
}

export async function upsertPineconeRecords(input: {
  userId: string;
  records: PineconeVectorRecord[];
}) {
  const config = getPineconeConfig();
  const client = createPineconeClient(config);
  const indexModel = await client.describeIndex(config.indexName);
  const index = client.index({ host: indexModel.host });

  return index.upsert({
    namespace: getUserNamespace(input.userId),
    records: input.records
  });
}

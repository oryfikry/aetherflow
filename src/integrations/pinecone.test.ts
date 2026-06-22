import { describe, expect, test } from "bun:test";

import {
  buildPineconeRecord,
  getPineconeConfig,
  getUserNamespace,
  sanitizePineconeFilter
} from "./pinecone";

describe("getPineconeConfig", () => {
  test("returns non-secret config when required env is present", () => {
    const config = getPineconeConfig({
      PINECONE_API_KEY: "pcsk_test",
      PINECONE_INDEX_NAME: "aetherflow-rag"
    });

    expect(config).toEqual({
      apiKey: "pcsk_test",
      indexName: "aetherflow-rag"
    });
  });

  test("throws a readable error when the API key is missing", () => {
    expect(() => getPineconeConfig({ PINECONE_INDEX_NAME: "aetherflow-rag" })).toThrow(
      "PINECONE_API_KEY is required"
    );
  });
});

describe("getUserNamespace", () => {
  test("scopes vectors by user id", () => {
    expect(getUserNamespace("user_123")).toBe("user:user_123");
  });

  test("rejects empty user ids", () => {
    expect(() => getUserNamespace("   ")).toThrow("userId is required");
  });
});

describe("buildPineconeRecord", () => {
  test("stores citation metadata without full chunk text", () => {
    const record = buildPineconeRecord({
      id: "chunk_01",
      values: [0.1, 0.2, 0.3],
      userId: "user_123",
      knowledgeSourceId: "source_456",
      sourceType: "manual_note",
      title: "Ethereum note",
      contentPreview: "Short preview only",
      chunkRef: "knowledge_chunks.chunk_01",
      createdAt: "2026-06-22T00:00:00.000Z",
      fullChunkText: "This should never be stored in Pinecone metadata"
    });

    expect(record.metadata).toEqual({
      userId: "user_123",
      knowledgeSourceId: "source_456",
      sourceType: "manual_note",
      title: "Ethereum note",
      contentPreview: "Short preview only",
      chunkRef: "knowledge_chunks.chunk_01",
      createdAt: "2026-06-22T00:00:00.000Z"
    });
    expect("fullChunkText" in record.metadata).toBe(false);
    expect("chunkText" in record.metadata).toBe(false);
  });
});

describe("sanitizePineconeFilter", () => {
  test("always adds user-owned filtering", () => {
    expect(sanitizePineconeFilter("user_123", { sourceType: { $eq: "manual_note" } })).toEqual({
      $and: [{ userId: { $eq: "user_123" } }, { sourceType: { $eq: "manual_note" } }]
    });
  });
});

# AetherFlow MVP Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local prototype slice for AI report automation: planner, mock report generation, Elysia API, and a Next.js dashboard-style UI.

**Architecture:** Keep the first slice local and deterministic. Shared domain modules produce skill recommendations and report preview data; the API exposes those modules; the Next.js UI renders the report automation experience against local sample data.

**Tech Stack:** Bun, TypeScript, Next.js App Router, Tailwind CSS, Elysia, Recharts.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `api/server.ts`

- [ ] Create the package and TypeScript configuration.
- [ ] Add the Next App Router files with the AetherFlow app shell.
- [ ] Add a minimal Elysia API with `/health`, `/api/skills/suggest`, and `/api/reports/preview`.

### Task 2: Planner and Report Domain

**Files:**
- Create: `src/domain/skills.ts`
- Create: `src/domain/planner.ts`
- Create: `src/domain/report.ts`
- Create: `src/domain/planner.test.ts`
- Create: `src/domain/report.test.ts`
- Create: `src/lib/sample-data.ts`

- [ ] Write failing tests for market-report skill assignment and report shape.
- [ ] Implement deterministic skill assignment for the Ethereum market prompt.
- [ ] Implement mock report preview generation with summary, chart data, evidence, RAG references, data cards, and next actions.
- [ ] Run tests and keep them passing.

### Task 3: Verification

**Files:**
- Modify only as needed based on verification failures.

- [ ] Run `bun test`.
- [ ] Run `bun run build`.
- [ ] If dependencies are installed successfully, start `bun run dev` and provide the local URL.

### Scope Notes

This slice intentionally does not wire Supabase, Pinecone, real provider keys, scheduling, file upload, or executable custom skills. Those come after the local report automation loop works.

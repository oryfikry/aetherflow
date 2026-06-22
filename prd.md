# Product Requirements Document: AI Automation Analyst

**Working product name:** AetherFlow  
**Document version:** 1.2  
**Owner:** Irfan Fikri  
**Target stack:** Next.js, Tailwind CSS, Elysia, Bun, Supabase, Pinecone, OpenAI-compatible AI providers  
**Primary UI background:** `#e9f4e4`  
**Status:** Draft PRD

---

## 1. Summary

AetherFlow starts as a focused AI report automation product for recurring research and analysis tasks. Its internal architecture is designed as a broader AI workflow automation platform foundation, but the first release should expose a simple report-oriented experience instead of a complex workflow builder.

Users describe a report task in natural language, the system assigns relevant skills, gathers data from external sources, retrieves related knowledge with RAG, reasons over the evidence, and generates a useful report preview with summaries, charts, related data, evidence, and images.

The app is designed for recurring research and analysis tasks, such as:

> “Investigate the market trend of Ethereum based on what is happening on the internet, reason over the evidence, use RAG, and generate a simple report with chart, related data, and images.”

Important correction: **Investigation is not a main navigation menu.** It is an example automation task type or output type inside the Automations module.

### 1.1 Product Strategy Alignment

AetherFlow should be both an AI report automation app and the foundation for a larger workflow automation platform, but those ambitions must be separated by maturity stage:

```txt
MVP product surface: focused AI report automation
MVP architecture: platform-ready automation engine
Post-MVP product surface: broader AI workflow automation platform
```

The first user-facing version should optimize for this vertical slice:

```txt
login -> create automation -> run manually -> retrieve RAG context -> generate report -> view run history
```

The platform foundation should still model automations as workflow steps, skills, data sources, runs, artifacts, and reports so future versions can add editable workflows, branching, scheduling, teams, and custom skill modules without rewriting the core architecture.

---

## 2. Product Goals

### 2.1 Primary Goals

1. Allow users to create repeatable AI report automations using natural language.
2. Automatically assign report-oriented skills to each automation based on the user's prompt.
3. Support external OpenAI-compatible AI providers.
4. Use RAG to retrieve relevant prior knowledge, previous outputs, uploaded documents, and connected data.
5. Generate clear, readable automation outputs with:
   - AI summary
   - reasoning and evidence
   - interactive charts
   - related structured data
   - related images
   - final report preview
6. Keep the MVP lightweight, fast, simple, and easy to operate while preserving platform-ready internals.
7. Store user auth and lightweight app data in Supabase.
8. Store vector/RAG data in Pinecone Serverless as the primary vector database.

### 2.2 Non-Goals for MVP

1. Not a full enterprise workflow automation platform.
2. Not a full no-code builder with complex branching logic.
3. Not a financial trading bot.
4. Not responsible for giving financial advice or executing trades.
5. Not a replacement for professional market analysis.
6. Not designed to support heavy multi-tenant enterprise workloads in the first version.
7. Not exposing arbitrary user-authored code execution for custom skills in MVP.
8. Not exposing a general branching workflow canvas in MVP.

---

## 3. Target Users

### 3.1 Primary User

Independent builders, analysts, researchers, founders, crypto watchers, and operators who repeatedly ask AI to investigate trends, summarize internet activity, or generate reports.

### 3.2 Example Use Cases

1. Investigate Ethereum market trend every morning.
2. Monitor competitor product launches.
3. Track industry news and summarize important changes.
4. Analyze sentiment around a token, product, company, or topic.
5. Generate weekly market reports.
6. Extract structured data from web sources.
7. Build a lightweight knowledge base from previous automation runs.

---

## 4. Core Concept

The product is centered around **Automations**.

For MVP, an automation is a saved repeatable AI report workflow. Internally it should still be represented as a workflow so the product can grow into a broader automation platform later.

Workflow maturity should be staged as:

```txt
MVP: generated linear workflow for report automation
Later: editable workflow steps
Future: branching and conditional workflow builder
```

An automation is a saved repeatable AI workflow with:

- name
- natural-language prompt
- assigned skills
- data sources
- AI provider/model configuration
- RAG settings
- schedule settings, initially manual-only in MVP
- output format
- run history
- generated reports

Example:

```txt
Automation Name: Ethereum Market Trend Investigator
Automation Type: Research / Investigation Report
Prompt: Investigate the current Ethereum market trend based on internet activity, news, social signals, and on-chain data. Use RAG memory, reason over evidence, and generate a readable report with chart and images.
Assigned Skills: Web Research, Market Analysis, Crypto Trend Analysis, RAG Retrieval, Chart Generation, Summarization, Image Selection
Output: Report Preview + Chart + Evidence + Related Images
```

---

## 5. Information Architecture

### 5.1 Main Navigation

```txt
Dashboard
Automations
Skills
Knowledge
Data Sources
Settings
```

### 5.2 Removed / Avoided Navigation

```txt
Investigations
```

Investigation should not be a separate top-level menu. It is a task type or output type inside Automations.

### 5.3 Automations Subsections

```txt
Automations
|-- All Automations
|-- Automation Builder
|-- Templates
|-- Runs / Reports
|-- Schedules
`-- Run Detail / Report Preview
```

### 5.4 Automation Output Types

```txt
Research Investigation
Market Trend Report
Competitor Monitor
News Digest
Price Alert Summary
Data Extraction Report
Sentiment Brief
Weekly Intelligence Report
```

---

## 6. Key User Flows

### 6.1 Create Automation Flow

1. User logs in with Supabase Auth.
2. User clicks **Create Automation**.
3. User writes a natural-language automation prompt.
4. System analyzes the prompt.
5. System auto-assigns skills.
6. User reviews or edits the assigned skills.
7. User chooses AI provider/model.
8. User chooses data sources.
9. User chooses RAG knowledge sources.
10. User runs a test preview.
11. System generates output preview.
12. User saves automation.
13. User optionally adds schedule.

### 6.2 Run Automation Flow

1. User opens an automation.
2. User clicks **Run** or waits for scheduled run.
3. System creates an automation run record.
4. System gathers data from external sources.
5. System retrieves relevant knowledge from Pinecone vector DB.
6. System reasons over evidence.
7. System generates structured output.
8. UI renders chart, data cards, reasoning, images, and report preview.
9. User saves, exports, reruns, or edits automation.
10. Final output metadata is stored in Supabase and its embeddings/chunks are indexed into Pinecone for future RAG.

### 6.3 Learn New Skill Flow

Maturity: **post-MVP**. In MVP, the system may suggest reusable skill templates, but it should not create executable skill code or alter the automation engine without explicit product work.

1. User creates or repeatedly edits automations that follow a similar pattern.
2. System detects repeated task behavior.
3. System suggests a new skill.
4. User reviews the suggested skill name, description, inputs, and outputs.
5. User approves the skill.
6. Skill appears in the Skills list.
7. Future automations can auto-assign this skill.

Example:

```txt
Suggested Skill: Competitor Monitoring
Purpose: Track competitor website updates, pricing changes, product launches, and public sentiment.
Inputs: competitor names, URLs, keywords, frequency
Outputs: summary, change log, risk/opportunity score
```

---

## 7. Functional Requirements

### 7.1 Authentication

**Provider:** Supabase Auth

Requirements:

- User can sign up and log in using email/password.
- User session persists across browser reloads.
- User data is scoped by `user_id`.
- User can log out.
- Future support may include OAuth providers.

Acceptance criteria:

- A logged-out user cannot access app pages.
- A logged-in user can only access their own automations, skills, knowledge sources, and runs.

---

### 7.2 AI Provider Configuration

The app must support external OpenAI-compatible providers.

Provider settings:

```txt
Provider name
Base URL
API key
Chat model
Embedding model
Default temperature
Max tokens
Timeout
```

Requirements:

- User can add an OpenAI-compatible provider.
- User can select provider per automation.
- API key must be encrypted or stored securely.
- Provider config should support both chat and embedding models.
- The app should expose an internal provider abstraction so the automation engine does not depend on one vendor.

Example provider config:

```json
{
  "name": "Custom OpenAI-Compatible Provider",
  "baseUrl": "https://api.example.com/v1",
  "chatModel": "model-name",
  "embeddingModel": "embedding-model-name"
}
```

Acceptance criteria:

- User can save a provider.
- User can test the provider connection.
- Automation run fails gracefully if provider is invalid.

---

### 7.3 Automation Builder

Requirements:

- User can create an automation from a natural-language prompt.
- User can edit automation name, description, prompt, skills, data sources, and manual run settings.
- System auto-generates a workflow plan from the prompt.
- User can run a test preview before saving.
- User can save automation as draft or active.

Builder sections:

```txt
Automation name
Natural-language prompt
AI provider/model selector
Auto-assigned skills
Workflow steps
Data sources
Knowledge/RAG settings
Schedule settings
Output preview
Save / Run controls
```

For MVP, schedule settings can be shown as disabled or "coming later" if the underlying scheduler is not implemented yet.

Acceptance criteria:

- User can create an automation in under 2 minutes.
- System suggests at least 3 relevant skills for a market investigation prompt.
- User can remove or add skills manually.

---

### 7.4 Skill System

Skills are reusable capabilities used by automations.

Skill maturity:

```txt
MVP: deterministic prompt/tool templates selected by the planner
Later: configurable workflow components with explicit inputs and outputs
Future: executable custom skill modules with sandboxing and permission controls
```

MVP skills must not execute arbitrary user-authored code. They should describe how the automation engine should plan, retrieve, analyze, visualize, or write the report.

Initial skill list:

```txt
Web Research
Market Analysis
Crypto Trend Analysis
Sentiment Analysis
RAG Retrieval
Chart Generation
Image Selection
Summarization
Data Extraction
Alert Monitoring
Report Writing
Evidence Ranking
```

Each skill should have:

```txt
id
name
description
category
input schema
output schema
execution type
status
created_by
version
```

Skill categories:

```txt
Research
Analysis
Retrieval
Visualization
Reporting
Monitoring
Data Processing
```

Skill statuses:

```txt
system
user_created
suggested
approved
archived
```

Requirements:

- System can auto-assign skills based on prompt intent.
- User can view all skills.
- User can approve suggested skills.
- User can add a custom skill manually as a non-executable prompt/tool template.
- Skills can be reused across automations.

Acceptance criteria:

- Ethereum market prompt auto-assigns Web Research, Market Analysis, Crypto Trend Analysis, RAG Retrieval, Chart Generation, Summarization, and Image Selection.
- New approved skill appears in skill library.
- Archived skill is no longer auto-assigned.

---

### 7.5 Knowledge and RAG

Knowledge is used to support retrieval-augmented generation.

Knowledge sources:

```txt
Uploaded documents
Saved reports
Previous automation outputs
Crawled web pages
Connected source snippets
Manual notes
```

Requirements:

- User can add knowledge sources.
- System chunks documents.
- System generates embeddings.
- Embeddings are stored in Pinecone.
- RAG retrieval is scoped to the user.
- Each automation can choose which knowledge sources to use.
- Generated reports can be indexed back into knowledge memory.

RAG retrieval output should include:

```txt
source title
source type
matched chunk
similarity score
created date
citation/reference metadata
```

Acceptance criteria:

- User can upload or add knowledge source.
- System indexes source chunks into Pinecone.
- Automation run can retrieve relevant chunks.
- Report output shows which knowledge sources were used.

---

### 7.6 Vector DB Decision

Primary RAG vector database: **Pinecone Serverless**.

Supabase remains the source of truth for authentication, user records, automation definitions, run history, report metadata, provider settings, and knowledge source metadata. Pinecone is the dedicated vector database for embeddings, semantic search, retrieved context, and automation memory.

Why Pinecone:

- Pinecone is purpose-built for vector search and RAG workloads.
- Pinecone Serverless keeps vector infrastructure managed and scalable.
- Namespaces allow clean isolation of vector records per user, team, or tenant.
- Metadata filtering can limit retrieval to the correct automation, source type, run, date range, or user-owned dataset.
- Using Pinecone keeps Supabase lighter and focused on relational app data.

Recommended strategy:

```txt
Primary vector DB: Pinecone Serverless
App relational DB: Supabase Postgres
Auth: Supabase Auth
File storage: Supabase Storage
Embedding generation: OpenAI-compatible embedding provider
```

Recommended Pinecone index:

```txt
Index name: aetherflow-rag
Index type: Dense vector index
Metric: cosine
Dimension: must match selected embedding model
Default namespace format: user:{user_id}
```

Namespace strategy:

```txt
user:{user_id}
```

Optional future namespace variants:

```txt
org:{organization_id}
user:{user_id}:automation:{automation_id}
```

Recommended Pinecone record shape:

```ts
{
  id: "chunk_01JABC...",
  values: [/* embedding vector */],
  metadata: {
    userId: "user_123",
    automationId: "automation_456",
    runId: "run_789",
    knowledgeSourceId: "source_123",
    sourceType: "web_snapshot",
    title: "Ethereum ETF inflow update",
    url: "https://example.com/article",
    contentPreview: "Short citation preview...",
    chunkRef: "knowledge_chunks.chunk_01JABC...",
    createdAt: "2026-06-22T00:00:00.000Z"
  }
}
```

Do not rely on Pinecone metadata as the primary store for full chunk text. Store full chunk content in Supabase or private storage, store `contentPreview` and lookup metadata in Pinecone, and fetch the full chunk by `chunkRef` only when needed for rendering or prompt assembly.

Metadata fields to filter by:

```txt
userId
automationId
runId
knowledgeSourceId
sourceType
createdAt
```

Important implementation note:

The Pinecone index dimension must match the selected embedding model. If the app allows users to switch embedding providers or embedding models, the system must either:

1. restrict each workspace to one embedding model per Pinecone index, or
2. create separate indexes per embedding dimension/model family.

For MVP, use one embedding model and one Pinecone index to keep the architecture simple.

Decision table:

| Layer | Choice | Responsibility |
|---|---|---|
| Auth | Supabase Auth | Login, sessions, user identity |
| Relational app DB | Supabase Postgres | Automations, runs, skills, settings, metadata |
| File storage | Supabase Storage | Uploaded files and generated artifacts |
| Vector DB | Pinecone Serverless | Embeddings, semantic search, RAG memory |
| AI provider | OpenAI-compatible provider | Chat completion, reasoning, embeddings |

---

### 7.7 Automation Execution Engine

The execution engine handles automation runs.

MVP execution should be modeled as a linear report-generation job:

```txt
automation definition -> run record -> queued job -> workflow steps -> report artifacts
```

For the first implementation, manual runs may execute synchronously if deployment is simple, but the code boundary should be job-oriented so it can move to a worker/queue without changing API contracts. Long-running scheduling, cancellation, and retries should be implemented behind this run boundary, not inside UI logic.

Suggested workflow:

```txt
1. Parse prompt
2. Identify task type
3. Assign skills
4. Build execution plan
5. Collect external data
6. Retrieve RAG context
7. Reason over evidence
8. Generate structured result
9. Render UI preview
10. Save run result
11. Index output into Pinecone memory
```

Run statuses:

```txt
Draft
Queued
Running
Completed
Failed
Cancelled
```

Requirements:

- Each run should be stored with logs and status.
- Failed runs should show readable error messages.
- Runs should be retryable.
- Long-running tasks should update progress.
- System should store intermediate artifacts where useful.

Acceptance criteria:

- User can see run status.
- User can open previous run reports.
- User can rerun an automation.
- Failed run displays error summary and failed step.

---

### 7.8 Output Preview and Report

Automation output should be useful and simple to read.

Required output sections:

```txt
AI Summary
Key Findings
Interactive Chart
Reasoning & Evidence
RAG References
Related Data Cards
Related Images
Final Report Preview
Recommended Next Actions
```

For Ethereum market trend example:

```txt
AI Summary:
Ethereum shows positive short-term momentum based on market data, internet sentiment, and on-chain activity.

Chart:
ETH/USD price movement with selectable time ranges.

Evidence:
News signals, social sentiment, on-chain indicators, macro context.

RAG:
Previous reports, saved notes, uploaded crypto research docs.

Images:
Related Ethereum/network/market visuals from approved image sources.
```

Chart requirements:

- Time range selector.
- Tooltip on hover.
- Support line chart, bar chart, and candlestick-style visualization where possible.
- Show summary metrics above or below chart.

Suggested chart library:

```txt
MVP: Recharts
Alternative: Tremor + Recharts
Advanced later: TradingView Lightweight Charts
```

Acceptance criteria:

- Output preview loads after a successful run.
- User can understand the result without reading long raw AI text.
- Chart is interactive.
- Evidence and RAG sources are visible.

---

### 7.9 Data Sources

MVP data source types:

```txt
Web search provider
News source/API
Crypto market API
Manual URLs
Uploaded files
Previous automation outputs
```

Future data source types:

```txt
Social media APIs
RSS feeds
On-chain analytics APIs
Google Drive
Notion
GitHub
Slack
Email
```

Requirements:

- User can configure data source credentials where needed.
- Automation can select one or more data sources.
- Data source failures should not always fail the whole run if fallback data exists.
- Run output should identify which sources were used.

---

## 8. UI / UX Requirements

### 8.1 Visual Direction

Base/background color:

```txt
#e9f4e4
```

Suggested palette:

```txt
Background: #e9f4e4
Primary:    #1f5a3c
Secondary:  #2e7d54
Muted:      #6baf7b
Card:       #ffffff
Border:     #dbe8d5
Text:       #1f2933
Muted Text: #64748b
Accent:     #2ea3f2
Warning:    #f4b400
Error:      #dc2626
```

Design principles:

- Light mode first.
- Clean SaaS layout.
- Rounded cards.
- Soft shadows.
- Simple typography.
- Information-dense but not overwhelming.
- Use green palette to communicate focus, trust, and calm analysis.

### 8.2 Main Screens

#### Dashboard

Purpose: give overview of recent automation activity.

Components:

```txt
Recent runs
Scheduled automations
Run success/failure stats
Credit usage
Quick create automation button
Saved reports
```

#### Automations List

Purpose: manage saved automations.

Components:

```txt
Automation cards/table
Status filter
Search
Task type filter
Create automation button
Last run status
Schedule indicator
```

#### Automation Builder

Purpose: create and edit automations.

Components:

```txt
Natural-language prompt editor
Provider/model selector
Auto-assigned skills panel
Workflow step preview
Data source selector
Knowledge source selector
Schedule settings
Run preview button
Save button
```

#### Automation Run Report

Purpose: view output from one automation run.

Components:

```txt
Run status
AI summary
Interactive chart
Reasoning & evidence
RAG references
Data cards
Related images
Report preview
Export/save/rerun buttons
```

#### Skills

Purpose: manage reusable automation skills.

Components:

```txt
Skill library
System skills
User-created skills
Suggested skills
Skill detail drawer
Add skill button
Archive skill action
```

#### Knowledge

Purpose: manage RAG memory.

Components:

```txt
Knowledge source list
Upload document
Add URL
Embedding sync status
Vector count
Last indexed timestamp
Source filter
```

#### Data Sources

Purpose: manage external data integrations.

Components:

```txt
Provider cards
Connection status
API key form
Test connection button
Source usage count
```

#### Settings

Purpose: manage user and app configuration.

Components:

```txt
Profile
AI providers
Default model
Embedding model
Billing/credits
Security
Theme
```

---

## 9. System Architecture

### 9.1 Proposed Stack

```txt
Frontend: Next.js App Router
Styling: Tailwind CSS
API Backend: Elysia on Bun
Auth: Supabase Auth
Database: Supabase Postgres
Storage: Supabase Storage
Vector DB: Pinecone Serverless
AI Provider: OpenAI-compatible external provider
Charts: Recharts or TradingView Lightweight Charts
Deployment: Vercel for frontend, Fly.io/Railway/Render for Bun API, or single VPS for lightweight deployment
```

### 9.2 High-Level Architecture

```txt
Next.js UI
  ↓
Elysia API on Bun
  ↓
Supabase Auth + Postgres + Storage
  ↓
Pinecone Serverless Vector DB
  ↓
External AI Provider
  ↓
External Data Sources
```

### 9.3 Backend Responsibilities

Elysia/Bun API should handle:

```txt
Automation CRUD
Skill assignment
Run orchestration
Provider calls
RAG retrieval
Document ingestion
Embedding generation
Chart data preparation
Report generation
Run logging
```

Next.js should handle:

```txt
Authenticated app shell
Dashboard UI
Automation builder UI
Run report UI
Skills UI
Knowledge UI
Settings UI
```

Supabase should handle:

```txt
Authentication
User records
Automation metadata
Run results
Provider settings metadata
Knowledge source metadata
File storage
Relational metadata for Pinecone-indexed knowledge
```

---

## 10. Data Model

### 10.1 users

Managed primarily by Supabase Auth.

Additional profile table:

```sql
profiles (
  id uuid primary key,
  email text,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz
)
```

### 10.2 ai_providers

```sql
ai_providers (
  id uuid primary key,
  user_id uuid references profiles(id),
  name text,
  base_url text,
  encrypted_api_key text,
  chat_model text,
  embedding_model text,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
)
```

### 10.3 automations

```sql
automations (
  id uuid primary key,
  user_id uuid references profiles(id),
  name text,
  description text,
  prompt text,
  task_type text,
  status text,
  provider_id uuid references ai_providers(id),
  schedule_config jsonb,
  output_config jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
```

### 10.4 skills

```sql
skills (
  id uuid primary key,
  user_id uuid null references profiles(id),
  name text,
  description text,
  category text,
  input_schema jsonb,
  output_schema jsonb,
  execution_type text,
  status text,
  version integer,
  created_at timestamptz,
  updated_at timestamptz
)
```

### 10.5 automation_skills

```sql
automation_skills (
  automation_id uuid references automations(id),
  skill_id uuid references skills(id),
  assignment_source text,
  created_at timestamptz,
  primary key (automation_id, skill_id)
)
```

### 10.6 automation_runs

```sql
automation_runs (
  id uuid primary key,
  automation_id uuid references automations(id),
  user_id uuid references profiles(id),
  status text,
  started_at timestamptz,
  completed_at timestamptz,
  input_snapshot jsonb,
  workflow_plan jsonb,
  result_summary text,
  result_json jsonb,
  error_message text,
  created_at timestamptz
)
```

### 10.7 knowledge_sources

```sql
knowledge_sources (
  id uuid primary key,
  user_id uuid references profiles(id),
  title text,
  source_type text,
  source_url text,
  storage_path text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
```

### 10.8 knowledge_chunks

Supabase stores chunk metadata and lifecycle state. Pinecone stores the actual vector embedding and searchable retrieval metadata.

```sql
knowledge_chunks (
  id uuid primary key,
  user_id uuid references profiles(id),
  knowledge_source_id uuid references knowledge_sources(id),
  pinecone_index text,
  pinecone_namespace text,
  pinecone_record_id text,
  content_preview text,
  token_count integer,
  metadata jsonb,
  indexed_at timestamptz,
  created_at timestamptz
)
```

Pinecone record metadata should include enough context for filtering, ranking display, and lightweight citations. Full chunk text should remain in Supabase or private storage and be loaded by reference when needed.

```ts
{
  userId: string,
  automationId?: string,
  runId?: string,
  knowledgeSourceId: string,
  sourceType: "upload" | "url" | "saved_report" | "web_snapshot" | "manual_note",
  title: string,
  url?: string,
  contentPreview: string,
  chunkRef: string,
  createdAt: string
}
```

### 10.9 run_artifacts

```sql
run_artifacts (
  id uuid primary key,
  run_id uuid references automation_runs(id),
  user_id uuid references profiles(id),
  artifact_type text,
  title text,
  content jsonb,
  storage_path text,
  created_at timestamptz
)
```

---

## 11. API Requirements

### 11.1 Auth

Supabase handles auth directly from frontend, with backend verifying JWT.

### 11.2 Automation API

```txt
GET    /api/automations
POST   /api/automations
GET    /api/automations/:id
PATCH  /api/automations/:id
DELETE /api/automations/:id
POST   /api/automations/:id/run
GET    /api/automations/:id/runs
```

### 11.3 Run API

```txt
GET    /api/runs/:id
POST   /api/runs/:id/retry
POST   /api/runs/:id/cancel
GET    /api/runs/:id/artifacts
```

### 11.4 Skill API

```txt
GET    /api/skills
POST   /api/skills
GET    /api/skills/:id
PATCH  /api/skills/:id
DELETE /api/skills/:id
POST   /api/skills/suggest
POST   /api/skills/:id/approve
```

### 11.5 Knowledge API

```txt
GET    /api/knowledge
POST   /api/knowledge/upload
POST   /api/knowledge/url
POST   /api/knowledge/:id/index
DELETE /api/knowledge/:id
POST   /api/rag/search
```

### 11.6 Provider API

```txt
GET    /api/providers
POST   /api/providers
PATCH  /api/providers/:id
DELETE /api/providers/:id
POST   /api/providers/:id/test
```

---

## 12. AI Workflow Details

### 12.1 Prompt Planner

Input:

```txt
User automation prompt
Available skills
Available data sources
User knowledge sources
```

Output:

```json
{
  "taskType": "market_trend_investigation",
  "recommendedSkills": [
    "web_research",
    "market_analysis",
    "crypto_trend_analysis",
    "rag_retrieval",
    "chart_generation",
    "summarization",
    "image_selection"
  ],
  "workflowSteps": [
    "collect_signals",
    "retrieve_knowledge",
    "analyze_evidence",
    "generate_chart_data",
    "write_report",
    "save_result"
  ]
}
```

### 12.2 RAG Retrieval

Retrieval should happen before final reasoning.

Recommended retrieval process:

```txt
1. Convert automation prompt and current run context into search query.
2. Generate embedding.
3. Search Pinecone using namespace `user:{user_id}` plus metadata filters for selected knowledge sources, automation IDs, source types, or date ranges.
4. Rerank or score chunks.
5. Pass top chunks into reasoning prompt.
6. Store retrieved sources in run artifacts.
```

### 12.3 Reasoning and Evidence

The system should separate:

```txt
Raw source data
Retrieved RAG context
AI analysis
Final user-facing conclusion
```

The final report should include evidence and uncertainty where possible.

---

## 13. Example Automation: Ethereum Market Trend Investigator

### 13.1 Prompt

```txt
Investigate the market trend of Ethereum based on current internet activity, news, market data, social sentiment, and on-chain indicators. Use RAG memory to compare against previous reports. Reason over the evidence and generate a readable report with chart, related data, and images.
```

### 13.2 Auto-Assigned Skills

```txt
Web Research
Market Analysis
Crypto Trend Analysis
Sentiment Analysis
RAG Retrieval
Chart Generation
Image Selection
Summarization
Report Writing
Evidence Ranking
```

### 13.3 Workflow

```txt
Collect internet/news signals
Collect market price data
Collect social/on-chain signals if configured
Retrieve related knowledge from RAG
Analyze signal agreement and disagreement
Generate chart data
Generate final summary and report
Select related images
Save result and index report into Pinecone memory
```

### 13.4 Output Preview

```txt
Title: Ethereum Market Trend Report
Status: Complete
Summary: Short readable AI summary
Chart: ETH/USD market movement
Evidence: News, social, on-chain, macro signals
RAG References: Previous reports and uploaded docs
Related Data: Price, volume, sentiment, active addresses
Related Images: Ethereum/network/market visuals
Next Actions: Watchlist items and follow-up prompts
```

### 13.5 Important Disclaimer

The app should display a disclaimer for market-related reports:

```txt
This report is generated for informational purposes only and is not financial advice.
```

---

## 14. Scheduling

MVP scheduling option:

```txt
Manual only
```

Post-MVP scheduling options:

```txt
Daily
Weekly
Monthly
Custom cron
```

Requirements:

- User can manually run automation.
- User can see scheduling as a planned capability if the UI includes schedule settings.
- Simple schedules should be implemented after the manual run path is reliable.
- Scheduled runs create normal automation run records when scheduling is implemented.
- Failed scheduled runs are visible in run history when scheduling is implemented.

---

## 15. Security and Privacy

Requirements:

- All data must be scoped by `user_id`.
- Supabase Row Level Security should be enabled for user-owned tables.
- API keys must not be exposed to the frontend after saving.
- Provider keys should be encrypted at rest.
- Provider keys should only be decrypted inside backend execution code that needs to call the provider.
- Saved provider keys should be write-only from the UI: users can replace a key, but cannot read the existing plaintext key back.
- Automation output should not leak another user’s knowledge data.
- RAG queries must filter by user-owned knowledge chunks.
- Uploaded files should be stored in private buckets.

---

## 16. Performance Requirements

MVP targets:

```txt
Dashboard initial load: < 2 seconds under normal conditions
Automation list load: < 2 seconds for first 50 automations
Run report load: < 3 seconds after run completion
Prompt-to-preview test run: depends on external providers, target < 60 seconds for lightweight runs
RAG retrieval: < 2 seconds for small user knowledge base
```

---

## 17. Error Handling

The app should handle:

```txt
Invalid AI provider key
AI provider timeout
Embedding failure
Vector DB failure
Data source failure
No search results
No RAG results
Chart data unavailable
Image source unavailable
Run cancelled
```

User-facing errors should be readable and actionable.

Example:

```txt
The automation could not fetch market data. The report was generated using available news and RAG context only.
```

---

## 18. MVP Scope

### 18.1 Must Have

```txt
Supabase login
Automation CRUD
Natural-language automation builder
OpenAI-compatible provider configuration
Skill auto-assignment
Basic skill library
Manual automation run
Run history
RAG with Pinecone Serverless
Manual text knowledge source
Structured report preview
Interactive line chart
Light green UI theme using #e9f4e4
```

### 18.2 Should Have

```txt
Provider connection test
Data source connection test
Knowledge source file upload
Export report as markdown
Index generated report into Pinecone memory
Basic related image support
Simple scheduling
```

### 18.3 Could Have

```txt
Advanced chart types
Pinecone backup/export or migration tools
Team workspace
Public report sharing
Notification alerts
OAuth login
Learn/suggest new skill
```

### 18.4 Won’t Have in MVP

```txt
Complex branching workflow builder
Real-time collaborative editing
Trading execution
Enterprise admin console
Advanced permission roles
Multi-agent marketplace
Executable custom user skills
```

---

## 19. Milestones

### Milestone 1: Foundation

```txt
Set up Next.js + Tailwind
Set up Elysia + Bun API
Set up Supabase Auth
Set up database schema
Build app shell and navigation
```

### Milestone 2: Automation Builder

```txt
Create automation CRUD
Build automation builder UI
Add OpenAI-compatible provider config
Add prompt planner
Add skill auto-assignment
```

### Milestone 3: RAG and Knowledge

```txt
Add knowledge source table
Add document/text ingestion
Generate embeddings
Store vectors in Pinecone
Implement RAG search
```

### Milestone 4: Automation Runs

```txt
Implement run engine
Create run records
Execute skills in sequence
Generate report JSON
Store artifacts
```

### Milestone 5: Output UI

```txt
Build run report page
Add AI summary cards
Add interactive chart
Add reasoning/evidence panel
Add RAG references
Add related images
```

### Milestone 6: Polish

```txt
Add scheduling
Add export markdown
Improve error handling
Improve loading states
Refine UI theme
```

---

## 20. Success Metrics

Product metrics:

```txt
Time to create first automation
Number of automations created per user
Automation rerun rate
Scheduled automation usage
Report open rate
Skill suggestion approval rate
Knowledge source indexing success rate
```

Quality metrics:

```txt
Run success rate
Average run duration
RAG retrieval latency
Provider failure rate
User manual correction rate
```

User value metrics:

```txt
User saves generated report
User reruns automation
User schedules automation
User adds knowledge sources
User creates or approves new skill
```

---

## 21. Open Questions

1. Which web search provider should be used for MVP?
2. Which crypto market data API should be used first?
3. Should related images come from web search, stock image APIs, or AI-generated images?
4. Should scheduling be handled inside Elysia worker, Supabase cron, or another job system?
5. Which backend job runner should own long-running automation runs after the manual MVP path?
6. Should generated reports be exportable as Markdown only, or also PDF later?
7. Should the app support multiple AI providers per automation step?

Aligned MVP decisions:

```txt
Custom user skills: prompt/tool templates only, no executable code
Workflow shape: generated linear workflow, no branching canvas
Scheduling: manual only for MVP
RAG storage: Pinecone vectors + citation metadata, Supabase/private storage for full chunk text
Initial product focus: AI report automation
Long-term architecture: general workflow automation platform foundation
```

---

## 22. Recommended Implementation Defaults

```txt
Auth: Supabase Auth
App database: Supabase Postgres
Vector DB: Pinecone Serverless
Frontend: Next.js App Router
Styling: Tailwind CSS
Backend: Elysia on Bun
Charts: Recharts for MVP
AI provider: OpenAI-compatible adapter
Report format: Structured JSON rendered into UI + exportable Markdown
Skill execution: Prompt/tool templates first, real code execution later
Scheduling: Manual run first, simple daily/weekly schedule second
```

---

## 23. Reference Links

- Pinecone Docs: https://docs.pinecone.io/guides/get-started/overview
- Pinecone Create an Index: https://docs.pinecone.io/guides/index-data/create-an-index
- Pinecone Upsert Records and Namespaces: https://docs.pinecone.io/guides/index-data/upsert-data
- Pinecone Metadata Filtering: https://docs.pinecone.io/guides/search/filter-by-metadata
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Postgres: https://supabase.com/docs/guides/database
- Supabase Storage: https://supabase.com/docs/guides/storage

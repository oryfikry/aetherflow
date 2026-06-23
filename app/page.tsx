"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  Archive,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  History,
  KeyRound,
  Play,
  Save,
  Settings,
  Sparkles
} from "lucide-react";

import {
  DEFAULT_THIRD_PARTY_PROVIDER,
  getProviderDisplayDefaults,
  type ProviderSettings
} from "@/domain/provider-settings";
import { readApiError } from "@/lib/api-error";
import { samplePlan, samplePrompt, sampleReport } from "@/lib/sample-data";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

const TrendChart = dynamic(
  () => import("@/components/trend-chart").then((mod) => mod.TrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
        Loading chart
      </div>
    )
  }
);

type View = "Dashboard" | "Automations" | "Skills" | "Knowledge" | "Reports" | "Settings";
type StatusKind = "info" | "success" | "error";
type ProviderStatus = {
  kind: StatusKind;
  text: string;
};
type ProviderSettingsResponse = {
  settings: ProviderSettings;
  configured: {
    apiKey: boolean;
    cohereApiKey: boolean;
  };
};

const navItems: Array<{ label: View; icon: typeof Activity }> = [
  { label: "Dashboard", icon: Activity },
  { label: "Automations", icon: Play },
  { label: "Skills", icon: Brain },
  { label: "Knowledge", icon: Database },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings }
];

const trendColor = {
  up: "text-aether-secondary",
  down: "text-red-600",
  flat: "text-slate-600"
};

const providerStatusClass: Record<StatusKind, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-700"
};

export default function Home() {
  const [activeView, setActiveView] = useState<View>("Dashboard");
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState<ProviderStatus | null>(null);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    ...DEFAULT_THIRD_PARTY_PROVIDER
  });
  const [configuredKeys, setConfiguredKeys] = useState({
    apiKey: false,
    cohereApiKey: false
  });
  const [testMessage, setTestMessage] = useState("hi what model are you?");
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const providerDefaults = getProviderDisplayDefaults();

  const authHeaders = (): Record<string, string> =>
    session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`
        }
      : {};

  useEffect(() => {
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!error) {
        setSession(data.session);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (activeView !== "Settings") {
      return;
    }

    async function loadProviderSettings() {
      try {
        const response = await fetch("http://127.0.0.1:4000/api/providers/settings", {
          headers: authHeaders()
        });

        if (!response.ok) {
          setProviderStatus({
            kind: "error",
            text: await readApiError(response)
          });
          return;
        }

        const payload = (await response.json()) as ProviderSettingsResponse;

        setProviderSettings(payload.settings);
        setConfiguredKeys(payload.configured);
      } catch (error) {
        setProviderStatus({
          kind: "error",
          text: error instanceof Error ? error.message : "Unable to load provider settings"
        });
      }
    }

    void loadProviderSettings();
  }, [activeView, session?.access_token]);

  async function signIn() {
    setAuthStatus({ kind: "info", text: "Signing in..." });

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    });

    setAuthStatus(
      error
        ? { kind: "error", text: error.message }
        : { kind: "success", text: "Signed in." }
    );
  }

  async function signUp() {
    setAuthStatus({ kind: "info", text: "Creating account..." });

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword
    });

    setAuthStatus(
      error
        ? { kind: "error", text: error.message }
        : { kind: "success", text: "Account created. Check email if confirmation is enabled." }
    );
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    setAuthStatus(
      error
        ? { kind: "error", text: error.message }
        : { kind: "success", text: "Signed out." }
    );
  }

  async function saveProviderSettings() {
    setProviderStatus({
      kind: "info",
      text: "Saving provider settings..."
    });

    try {
      const response = await fetch("http://127.0.0.1:4000/api/providers/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify(providerSettings)
      });

      if (!response.ok) {
        setProviderStatus({
          kind: "error",
          text: await readApiError(response)
        });
        return;
      }

      const payload = (await response.json()) as ProviderSettingsResponse;

      setProviderSettings(payload.settings);
      setConfiguredKeys(payload.configured);
      setProviderStatus({
        kind: "success",
        text: "Provider settings saved."
      });
    } catch (error) {
      setProviderStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Unable to save provider settings"
      });
    }
  }

  async function testProviderConnection() {
    setProviderStatus({
      kind: "info",
      text: "Testing provider..."
    });

    try {
      const response = await fetch("http://127.0.0.1:4000/api/providers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          message: testMessage,
          provider: providerSettings
        })
      });
      if (!response.ok) {
        setProviderStatus({
          kind: "error",
          text: await readApiError(response)
        });
        return;
      }

      const payload = (await response.json()) as { content?: string };
      setProviderStatus({
        kind: "success",
        text: payload.content ? `Provider replied: ${payload.content}` : "Provider connected"
      });
    } catch (error) {
      setProviderStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Provider test failed"
      });
    }
  }

  function updateProviderSettings<K extends keyof ProviderSettings>(
    key: K,
    value: ProviderSettings[K]
  ) {
    setProviderSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main className="min-h-screen bg-aether-bg">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[248px_1fr]">
        <aside className="border-aether-border bg-white/78 lg:border-r">
          <div className="flex h-full flex-col gap-7 px-5 py-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-aether-primary text-white">
                  <Sparkles size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-aether-text">AetherFlow</p>
                  <p className="text-xs font-medium text-slate-500">Report automation</p>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                    activeView === item.label
                      ? "bg-aether-primary text-white"
                      : "text-slate-600 hover:bg-aether-bg"
                  }`}
                  onClick={() => setActiveView(item.label)}
                  type="button"
                >
                  <item.icon size={17} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-md border border-aether-border bg-aether-bg p-4">
              <p className="text-sm font-semibold text-aether-text">MVP focus</p>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                Manual report automation first. Scheduling, live providers, and learned skills
                come after the core loop works.
              </p>
            </div>
          </div>
        </aside>

        <section className="px-4 py-5 sm:px-6 lg:px-8">
          {activeView === "Settings" ? (
            <section>
              <header className="mb-6 flex flex-col gap-4 border-b border-aether-border pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-aether-secondary">
                    Settings
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-aether-text">
                    External AI Provider
                  </h1>
                </div>
              </header>

              <div className="grid gap-5 xl:grid-cols-[minmax(320px,520px)_1fr]">
                <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="text-aether-secondary" size={18} aria-hidden="true" />
                    <h2 className="text-base font-semibold text-aether-text">
                      OpenAI-Compatible Provider
                    </h2>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <section className="rounded-md border border-aether-border bg-aether-bg/50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="grid flex-1 gap-2 text-sm font-semibold text-aether-text">
                          Account email
                          <input
                            className="h-10 rounded-md border border-aether-border bg-white px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                            onChange={(event) => setAuthEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            value={authEmail}
                          />
                        </div>
                        <div className="grid flex-1 gap-2 text-sm font-semibold text-aether-text">
                          Password
                          <input
                            className="h-10 rounded-md border border-aether-border bg-white px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                            onChange={(event) => setAuthPassword(event.target.value)}
                            placeholder="Password"
                            type="password"
                            value={authPassword}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {session ? (
                          <button
                            className="inline-flex h-9 items-center justify-center rounded-md border border-aether-border bg-white px-3 text-sm font-semibold text-aether-text"
                            onClick={signOut}
                            type="button"
                          >
                            Sign out
                          </button>
                        ) : (
                          <>
                            <button
                              className="inline-flex h-9 items-center justify-center rounded-md bg-aether-primary px-3 text-sm font-semibold text-white"
                              onClick={signIn}
                              type="button"
                            >
                              Sign in
                            </button>
                            <button
                              className="inline-flex h-9 items-center justify-center rounded-md border border-aether-border bg-white px-3 text-sm font-semibold text-aether-text"
                              onClick={signUp}
                              type="button"
                            >
                              Sign up
                            </button>
                          </>
                        )}
                        <span className="inline-flex h-9 items-center rounded-md px-2 text-xs font-semibold text-slate-600">
                          {session ? `Signed in as ${session.user.email}` : "Using local-dev fallback"}
                        </span>
                      </div>
                      {authStatus ? (
                        <p
                          className={`mt-3 rounded-md border p-3 text-sm font-semibold ${
                            providerStatusClass[authStatus.kind]
                          }`}
                        >
                          {authStatus.text}
                        </p>
                      ) : null}
                    </section>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Provider name
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) => updateProviderSettings("name", event.target.value)}
                        placeholder={providerDefaults.name}
                        value={providerSettings.name}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Base URL
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) => updateProviderSettings("baseUrl", event.target.value)}
                        placeholder={providerDefaults.baseUrl}
                        value={providerSettings.baseUrl}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      API key
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) => updateProviderSettings("apiKey", event.target.value)}
                        placeholder={
                          configuredKeys.apiKey
                            ? "Configured in .env; enter new key to replace"
                            : providerDefaults.apiKeyPlaceholder
                        }
                        type="password"
                        value={providerSettings.apiKey}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          configuredKeys.apiKey ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {configuredKeys.apiKey ? "Saved key is configured" : "API key is empty"}
                      </span>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Chat model
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) => updateProviderSettings("chatModel", event.target.value)}
                        placeholder={providerDefaults.chatModel}
                        value={providerSettings.chatModel}
                      />
                    </label>

                    <div className="rounded-md border border-aether-border bg-aether-bg/50 p-3">
                      <p className="text-sm font-semibold text-aether-text">Embedding provider</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Cohere is used for RAG embeddings.
                      </p>
                    </div>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Cohere API key
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) =>
                          updateProviderSettings("cohereApiKey", event.target.value)
                        }
                        placeholder={
                          configuredKeys.cohereApiKey
                            ? "Configured in .env; enter new key to replace"
                            : "Paste Cohere API key"
                        }
                        type="password"
                        value={providerSettings.cohereApiKey}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          configuredKeys.cohereApiKey ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {configuredKeys.cohereApiKey
                          ? "Saved Cohere key is configured"
                          : "Cohere key is empty"}
                      </span>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Cohere embedding model
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) =>
                          updateProviderSettings("cohereEmbeddingModel", event.target.value)
                        }
                        placeholder="embed-v4.0"
                        value={providerSettings.cohereEmbeddingModel}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Cohere input type
                      <select
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) =>
                          updateProviderSettings(
                            "cohereInputType",
                            event.target.value as ProviderSettings["cohereInputType"]
                          )
                        }
                        value={providerSettings.cohereInputType}
                      >
                        <option value="search_query">Search query</option>
                        <option value="search_document">Search document</option>
                        <option value="classification">Classification</option>
                        <option value="clustering">Clustering</option>
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Timeout
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        min={1}
                        onChange={(event) =>
                          updateProviderSettings("timeoutMs", Number(event.target.value))
                        }
                        type="number"
                        value={providerSettings.timeoutMs}
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-semibold text-aether-text">
                      Test message
                      <input
                        className="h-10 rounded-md border border-aether-border bg-aether-bg/60 px-3 text-sm font-medium outline-none focus:border-aether-secondary"
                        onChange={(event) => setTestMessage(event.target.value)}
                        value={testMessage}
                      />
                    </label>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-aether-border bg-white px-4 text-sm font-semibold text-aether-text"
                        onClick={saveProviderSettings}
                        type="button"
                      >
                        <Save size={16} aria-hidden="true" />
                        Save provider
                      </button>

                      <button
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-aether-primary px-4 text-sm font-semibold text-white"
                        onClick={testProviderConnection}
                        type="button"
                      >
                        <Play size={16} aria-hidden="true" />
                        Test connection
                      </button>
                    </div>

                    {providerStatus ? (
                      <p
                        className={`rounded-md border p-3 text-sm font-semibold ${
                          providerStatusClass[providerStatus.kind]
                        }`}
                      >
                        {providerStatus.text}
                      </p>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-aether-text">Provider Notes</h2>
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                    <p>
                      The placeholder is set for 9Router using the OpenAI-compatible chat
                      completions format.
                    </p>
                    <p>
                      API keys are not bundled into source. For real persistence, the next step is
                      encrypted provider storage in Supabase.
                    </p>
                    <p>
                      RAG search still needs an embedding model from the same provider or another
                      OpenAI-compatible embedding provider.
                    </p>
                  </div>
                </section>
              </div>
            </section>
          ) : (
            <>
              <header className="mb-6 flex flex-col gap-4 border-b border-aether-border pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-aether-secondary">
                    AI report automation
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-aether-text">
                    Ethereum Market Trend Investigator
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-aether-border bg-white px-4 text-sm font-semibold text-aether-text"
                    type="button"
                  >
                    <Archive size={16} aria-hidden="true" />
                    Save draft
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-aether-primary px-4 text-sm font-semibold text-white"
                    type="button"
                  >
                    <Play size={16} aria-hidden="true" />
                    Run preview
                  </button>
                </div>
              </header>

              <div className="grid gap-5 xl:grid-cols-[minmax(320px,420px)_1fr]">
            <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-aether-text">Automation Builder</h2>
                <span className="rounded-md bg-aether-bg px-2 py-1 text-xs font-semibold text-aether-secondary">
                  Manual MVP
                </span>
              </div>

              <label className="mt-5 block text-sm font-semibold text-aether-text" htmlFor="prompt">
                Natural-language prompt
              </label>
              <textarea
                className="mt-2 min-h-40 w-full resize-none rounded-md border border-aether-border bg-aether-bg/60 p-3 text-sm leading-6 text-aether-text outline-none focus:border-aether-secondary"
                defaultValue={samplePrompt}
                id="prompt"
              />

              <div className="mt-5">
                <p className="text-sm font-semibold text-aether-text">Generated workflow</p>
                <div className="mt-3 grid gap-2">
                  {samplePlan.workflowSteps.map((step, index) => (
                    <div
                      className="flex items-center gap-3 rounded-md border border-aether-border bg-white px-3 py-2"
                      key={step}
                    >
                      <span className="flex size-7 items-center justify-center rounded-md bg-aether-bg text-xs font-bold text-aether-secondary">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium capitalize text-slate-700">
                        {step.replaceAll("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-aether-text">Auto-assigned skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {samplePlan.recommendedSkills.map((skill) => (
                    <span
                      className="rounded-md border border-aether-border bg-aether-bg px-2.5 py-1 text-xs font-semibold text-aether-secondary"
                      key={skill.id}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                {sampleReport.dataCards.map((card) => (
                  <div
                    className="rounded-lg border border-aether-border bg-white p-4 shadow-sm"
                    key={card.label}
                  >
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <p className={`mt-2 text-2xl font-semibold ${trendColor[card.trend]}`}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-aether-secondary" size={18} aria-hidden="true" />
                      <h2 className="text-lg font-semibold text-aether-text">{sampleReport.title}</h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {sampleReport.summary}
                    </p>
                  </div>
                  <span className="inline-flex h-8 items-center rounded-md bg-aether-secondary px-3 text-xs font-semibold text-white">
                    {sampleReport.status}
                  </span>
                </div>

                <div className="mt-5 h-72 rounded-md border border-aether-border bg-aether-bg/40 p-3">
                  <TrendChart data={sampleReport.chart.series} />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-2">
                <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-aether-secondary" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-aether-text">Evidence</h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {sampleReport.evidence.map((item) => (
                      <article className="border-t border-aether-border pt-3" key={item.title}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-aether-text">{item.title}</h3>
                          <span className="text-xs font-semibold text-aether-soft-blue">
                            {item.confidence}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">{item.source}</p>
                        <p className="mt-2 text-sm leading-5 text-slate-600">{item.note}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <History size={18} className="text-aether-secondary" aria-hidden="true" />
                    <h2 className="text-base font-semibold text-aether-text">RAG References</h2>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {sampleReport.ragReferences.map((reference) => (
                      <article className="border-t border-aether-border pt-3" key={reference.title}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-aether-text">
                            {reference.title}
                          </h3>
                          <span className="text-xs font-semibold text-aether-warning">
                            {Math.round(reference.similarityScore * 100)}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                          {reference.sourceType.replaceAll("_", " ")}
                        </p>
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {reference.contentPreview}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <section className="rounded-lg border border-aether-border bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-aether-text">Recommended Next Actions</h2>
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  {sampleReport.nextActions.map((action) => (
                    <p
                      className="rounded-md border border-aether-border bg-aether-bg/70 p-3 text-sm leading-5 text-slate-700"
                      key={action}
                    >
                      {action}
                    </p>
                  ))}
                </div>
                <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  {sampleReport.disclaimer}
                </p>
              </section>
            </section>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

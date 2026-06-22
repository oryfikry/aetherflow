type ApiErrorPayload = {
  type?: unknown;
  error?: unknown;
  message?: unknown;
  property?: unknown;
  summary?: unknown;
  errors?: Array<{
    path?: unknown;
    message?: unknown;
    summary?: unknown;
  }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toLabel = (path: unknown) => {
  if (typeof path !== "string" || !path) {
    return "";
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const labels: Record<string, string> = {
    "provider/apiKey": "API key",
    "provider/baseUrl": "Base URL",
    "provider/chatModel": "Chat model",
    "provider/name": "Provider name",
    message: "Test message"
  };

  return labels[normalizedPath] ?? normalizedPath.replaceAll("/", " ");
};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const simplifyValidationMessage = (label: string, message: string) => {
  if (/string length greater or equal to 1/i.test(message)) {
    return label ? `${label} is required.` : "Required field is missing.";
  }

  if (label && message.toLowerCase().startsWith(label.toLowerCase())) {
    return message.endsWith(".") ? message : `${message}.`;
  }

  return label ? `${label} - ${message}` : message;
};

export function formatApiError(status: number, statusText: string, payload: unknown): string {
  if (typeof payload === "string") {
    return payload.trim() || `HTTP ${status}: ${statusText || "Request failed"}`;
  }

  if (!isRecord(payload)) {
    return `HTTP ${status}: ${statusText || "Request failed"}`;
  }

  const apiPayload = payload as ApiErrorPayload;
  const firstError = Array.isArray(apiPayload.errors) ? apiPayload.errors[0] : undefined;
  const property = toLabel(apiPayload.property) || toLabel(firstError?.path);
  const summary = asString(apiPayload.summary) || asString(firstError?.summary);
  const validationMessage = summary || asString(firstError?.message);

  if (asString(apiPayload.type) === "validation" || validationMessage) {
    return `Invalid provider settings: ${simplifyValidationMessage(property, validationMessage)}`;
  }

  const explicitMessage = asString(apiPayload.error) || asString(apiPayload.message);

  if (explicitMessage) {
    return explicitMessage;
  }

  return `HTTP ${status}: ${statusText || "Request failed"}`;
}

export async function readApiError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return formatApiError(response.status, response.statusText, await response.json());
  }

  return formatApiError(response.status, response.statusText, await response.text());
}

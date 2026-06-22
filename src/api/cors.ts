const DEFAULT_WEB_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

type OriginEnv = Record<string, string | undefined> & {
  WEB_ORIGIN?: string;
  WEB_ORIGINS?: string;
};

const splitOrigins = (value: string) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const buildAllowedOrigins = (env: OriginEnv) => {
  const configuredOrigins = env.WEB_ORIGINS ?? env.WEB_ORIGIN;

  if (!configuredOrigins) {
    return DEFAULT_WEB_ORIGINS;
  }

  return splitOrigins(configuredOrigins);
};

export const isAllowedOrigin = (origin: string | null, allowedOrigins: string[]) =>
  Boolean(origin && allowedOrigins.includes(origin));

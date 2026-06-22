import { describe, expect, test } from "bun:test";

import { buildAllowedOrigins, isAllowedOrigin } from "./cors";

describe("buildAllowedOrigins", () => {
  test("allows both localhost and 127.0.0.1 frontends by default", () => {
    expect(buildAllowedOrigins({})).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ]);
  });

  test("accepts comma-separated custom origins", () => {
    expect(
      buildAllowedOrigins({
        WEB_ORIGINS: "https://app.example.com, https://staging.example.com "
      })
    ).toEqual(["https://app.example.com", "https://staging.example.com"]);
  });
});

describe("isAllowedOrigin", () => {
  test("accepts the 127.0.0.1 local frontend origin", () => {
    expect(isAllowedOrigin("http://127.0.0.1:3000", buildAllowedOrigins({}))).toBe(true);
  });

  test("rejects unconfigured origins", () => {
    expect(isAllowedOrigin("https://evil.example.com", buildAllowedOrigins({}))).toBe(false);
  });
});

import { describe, expect, test } from "bun:test";

import { formatApiError } from "./api-error";

describe("formatApiError", () => {
  test("formats Elysia validation responses with the failing property", () => {
    expect(
      formatApiError(422, "Unprocessable Entity", {
        type: "validation",
        property: "/provider/apiKey",
        message: "Expected string length greater or equal to 1",
        summary: "Expected string length greater or equal to 1"
      })
    ).toBe("Invalid provider settings: API key is required.");
  });

  test("does not duplicate the property when the validation message already includes it", () => {
    expect(
      formatApiError(422, "Unprocessable Entity", {
        type: "validation",
        property: "/provider/apiKey",
        summary: "API key is required"
      })
    ).toBe("Invalid provider settings: API key is required.");
  });

  test("uses explicit API error messages", () => {
    expect(formatApiError(503, "Service Unavailable", { error: "Provider key rejected" })).toBe(
      "Provider key rejected"
    );
  });

  test("falls back to HTTP status text", () => {
    expect(formatApiError(500, "Internal Server Error", {})).toBe(
      "HTTP 500: Internal Server Error"
    );
  });
});

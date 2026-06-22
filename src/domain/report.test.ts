import { describe, expect, test } from "bun:test";

import { generateReportPreview } from "./report";

describe("generateReportPreview", () => {
  test("returns a structured report preview with chart data and visible evidence", () => {
    const report = generateReportPreview({
      prompt: "Investigate Ethereum market trend",
      topic: "Ethereum"
    });

    expect(report.title).toBe("Ethereum Market Trend Report");
    expect(report.summary).toContain("Ethereum");
    expect(report.chart.series.length).toBeGreaterThanOrEqual(5);
    expect(report.evidence.length).toBeGreaterThanOrEqual(3);
    expect(report.ragReferences[0]).toMatchObject({
      sourceType: "saved_report",
      similarityScore: expect.any(Number)
    });
    expect(report.disclaimer).toBe(
      "This report is generated for informational purposes only and is not financial advice."
    );
  });
});

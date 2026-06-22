import { describe, expect, test } from "bun:test";

import { planAutomation } from "./planner";

describe("planAutomation", () => {
  test("assigns report-focused skills for an Ethereum market investigation prompt", () => {
    const plan = planAutomation(
      "Investigate the market trend of Ethereum based on current internet activity, news, market data, social sentiment, and on-chain indicators. Use RAG memory and generate a readable report with chart."
    );

    expect(plan.taskType).toBe("market_trend_report");
    expect(plan.recommendedSkills.map((skill) => skill.name)).toEqual([
      "Web Research",
      "Market Analysis",
      "Crypto Trend Analysis",
      "Sentiment Analysis",
      "RAG Retrieval",
      "Chart Generation",
      "Summarization",
      "Report Writing",
      "Evidence Ranking"
    ]);
    expect(plan.workflowSteps).toEqual([
      "collect_signals",
      "retrieve_knowledge",
      "rank_evidence",
      "generate_chart_data",
      "write_report",
      "save_result"
    ]);
  });
});

import { getSkillsById, type Skill } from "./skills";

export type WorkflowStep =
  | "collect_signals"
  | "retrieve_knowledge"
  | "rank_evidence"
  | "generate_chart_data"
  | "write_report"
  | "save_result";

export type AutomationPlan = {
  taskType: "market_trend_report" | "research_report";
  recommendedSkills: Skill[];
  workflowSteps: WorkflowStep[];
};

const MARKET_TERMS = ["market", "price", "trend", "ethereum", "crypto", "token"];

export function planAutomation(prompt: string): AutomationPlan {
  const normalizedPrompt = prompt.toLowerCase();
  const isMarketReport = MARKET_TERMS.some((term) => normalizedPrompt.includes(term));

  const skillIds = isMarketReport
    ? [
        "web_research",
        "market_analysis",
        "crypto_trend_analysis",
        "sentiment_analysis",
        "rag_retrieval",
        "chart_generation",
        "summarization",
        "report_writing",
        "evidence_ranking"
      ]
    : [
        "web_research",
        "rag_retrieval",
        "summarization",
        "report_writing",
        "evidence_ranking"
      ];

  return {
    taskType: isMarketReport ? "market_trend_report" : "research_report",
    recommendedSkills: getSkillsById(skillIds),
    workflowSteps: [
      "collect_signals",
      "retrieve_knowledge",
      "rank_evidence",
      "generate_chart_data",
      "write_report",
      "save_result"
    ]
  };
}

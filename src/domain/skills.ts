export type SkillCategory =
  | "Research"
  | "Analysis"
  | "Retrieval"
  | "Visualization"
  | "Reporting"
  | "Monitoring"
  | "Data Processing";

export type Skill = {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  executionType: "prompt_template" | "tool_template";
  status: "system" | "user_created" | "suggested" | "approved" | "archived";
};

export const SYSTEM_SKILLS: Skill[] = [
  {
    id: "web_research",
    name: "Web Research",
    description: "Collects current internet and news signals for a report.",
    category: "Research",
    executionType: "tool_template",
    status: "system"
  },
  {
    id: "market_analysis",
    name: "Market Analysis",
    description: "Interprets price, volume, and market context.",
    category: "Analysis",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "crypto_trend_analysis",
    name: "Crypto Trend Analysis",
    description: "Adds crypto-specific trend, token, and network context.",
    category: "Analysis",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "sentiment_analysis",
    name: "Sentiment Analysis",
    description: "Summarizes directional sentiment from available signals.",
    category: "Analysis",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "rag_retrieval",
    name: "RAG Retrieval",
    description: "Retrieves relevant prior knowledge and previous reports.",
    category: "Retrieval",
    executionType: "tool_template",
    status: "system"
  },
  {
    id: "chart_generation",
    name: "Chart Generation",
    description: "Prepares chart-ready time-series and summary metrics.",
    category: "Visualization",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "image_selection",
    name: "Image Selection",
    description: "Selects approved related images for richer reports.",
    category: "Visualization",
    executionType: "tool_template",
    status: "system"
  },
  {
    id: "summarization",
    name: "Summarization",
    description: "Produces compact user-facing summaries.",
    category: "Reporting",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "data_extraction",
    name: "Data Extraction",
    description: "Extracts structured data from source material.",
    category: "Data Processing",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "alert_monitoring",
    name: "Alert Monitoring",
    description: "Identifies changes that may need follow-up.",
    category: "Monitoring",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "report_writing",
    name: "Report Writing",
    description: "Assembles findings into a readable report.",
    category: "Reporting",
    executionType: "prompt_template",
    status: "system"
  },
  {
    id: "evidence_ranking",
    name: "Evidence Ranking",
    description: "Ranks evidence by relevance, freshness, and confidence.",
    category: "Analysis",
    executionType: "prompt_template",
    status: "system"
  }
];

export function getSkillsById(ids: string[]): Skill[] {
  return ids
    .map((id) => SYSTEM_SKILLS.find((skill) => skill.id === id))
    .filter((skill): skill is Skill => Boolean(skill));
}

export type ReportPreviewInput = {
  prompt: string;
  topic: string;
};

export type ChartPoint = {
  label: string;
  value: number;
  sentiment: number;
};

export type ReportPreview = {
  title: string;
  status: "Complete";
  summary: string;
  keyFindings: string[];
  chart: {
    title: string;
    series: ChartPoint[];
  };
  evidence: Array<{
    title: string;
    source: string;
    confidence: "High" | "Medium";
    note: string;
  }>;
  ragReferences: Array<{
    title: string;
    sourceType: "saved_report" | "manual_note";
    similarityScore: number;
    contentPreview: string;
  }>;
  dataCards: Array<{
    label: string;
    value: string;
    trend: "up" | "down" | "flat";
  }>;
  nextActions: string[];
  disclaimer: string;
};

export function generateReportPreview(input: ReportPreviewInput): ReportPreview {
  const topic = input.topic.trim() || "Market";

  return {
    title: `${topic} Market Trend Report`,
    status: "Complete",
    summary: `${topic} shows constructive short-term momentum in this sample report, with price action, sentiment, and prior knowledge pointing in the same direction. Treat this as a deterministic preview until live data sources are connected.`,
    keyFindings: [
      "Recent price movement is modeled as gradually positive.",
      "Signal agreement is strongest between market data and saved RAG context.",
      "The report keeps uncertainty visible instead of presenting a trade recommendation."
    ],
    chart: {
      title: `${topic} trend preview`,
      series: [
        { label: "Mon", value: 3120, sentiment: 62 },
        { label: "Tue", value: 3184, sentiment: 64 },
        { label: "Wed", value: 3158, sentiment: 61 },
        { label: "Thu", value: 3260, sentiment: 68 },
        { label: "Fri", value: 3312, sentiment: 71 },
        { label: "Sat", value: 3294, sentiment: 69 },
        { label: "Sun", value: 3348, sentiment: 73 }
      ]
    },
    evidence: [
      {
        title: "Market structure",
        source: "Mock crypto market API",
        confidence: "Medium",
        note: "Price and volume preview data show modest upward momentum."
      },
      {
        title: "Internet activity",
        source: "Mock web research",
        confidence: "Medium",
        note: "News and discussion signals are modeled as cautiously positive."
      },
      {
        title: "Prior reports",
        source: "RAG memory preview",
        confidence: "High",
        note: "Saved report context supports comparison against previous trend summaries."
      }
    ],
    ragReferences: [
      {
        title: "Previous Ethereum weekly report",
        sourceType: "saved_report",
        similarityScore: 0.89,
        contentPreview: "Prior report noted improving liquidity and rising developer activity."
      },
      {
        title: "Manual macro note",
        sourceType: "manual_note",
        similarityScore: 0.76,
        contentPreview: "Macro context remains a risk factor for high-beta crypto assets."
      }
    ],
    dataCards: [
      { label: "Modeled Price", value: "$3,348", trend: "up" },
      { label: "Sentiment", value: "73 / 100", trend: "up" },
      { label: "Evidence Confidence", value: "Medium", trend: "flat" }
    ],
    nextActions: [
      "Connect a live crypto market data provider.",
      "Add saved research notes to improve RAG comparison.",
      "Rerun the automation after web search is configured."
    ],
    disclaimer:
      "This report is generated for informational purposes only and is not financial advice."
  };
}

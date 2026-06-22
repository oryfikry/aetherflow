import { planAutomation } from "@/domain/planner";
import { generateReportPreview } from "@/domain/report";

export const samplePrompt =
  "Investigate the market trend of Ethereum based on current internet activity, news, market data, social sentiment, and on-chain indicators. Use RAG memory to compare against previous reports. Reason over the evidence and generate a readable report with chart, related data, and images.";

export const samplePlan = planAutomation(samplePrompt);

export const sampleReport = generateReportPreview({
  prompt: samplePrompt,
  topic: "Ethereum"
});

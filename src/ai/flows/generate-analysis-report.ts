'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Input Schema for the Analysis Report
 */
const GenerateAnalysisReportInputSchema = z.object({
  stats: z.record(z.any()).describe('Current system stats (users, courses, etc.)'),
  recentLogs: z.array(z.any()).optional().describe('Recent system logs for context'),
});

export type GenerateAnalysisReportInput = z.infer<typeof GenerateAnalysisReportInputSchema>;

/**
 * Output Schema for the Analysis Report
 */
const GenerateAnalysisReportOutputSchema = z.object({
  reportMarkdown: z.string().describe('The generated executive analysis report in Markdown format.'),
});

export type GenerateAnalysisReportOutput = z.infer<typeof GenerateAnalysisReportOutputSchema>;

/**
 * Prompt Definition for Analysis Report
 */
const generateAnalysisReportPrompt = ai.definePrompt({
  name: 'generateAnalysisReportPrompt',
  input: { schema: GenerateAnalysisReportInputSchema },
  output: { schema: GenerateAnalysisReportOutputSchema },
  prompt: `You are an AI System Auditor for the "Campus Hub" platform. 
Your task is to analyze the provided system statistics and recent activity logs to produce a high-level "Executive Analysis Report".

### SYSTEM DATA SUMMARY
Stats:
{{stats}}

Recent Activity Context:
{{recentLogs}}

### INSTRUCTIONS
The report should be professional, data-driven, and formatted in Markdown. 
It must include the following sections:
1. **Executive Summary**: A brief overview of the system's current state.
2. **User Engagement**: Analysis of user growth and role distribution.
3. **Operational Metrics**: Overview of courses, quizzes, and attempts.
4. **Security & Integrity**: Insights from the security logs (if provided).
5. **Recommendations**: 2-3 actionable items for the Super Admin to improve the platform.

Keep the tone professional and the insights concise. Avoid being overly technical; focus on executive-level findings.`,
});

/**
 * Flow Definition
 */
const generateAnalysisReportFlow = ai.defineFlow(
  {
    name: 'generateAnalysisReportFlow',
    inputSchema: GenerateAnalysisReportInputSchema,
    outputSchema: GenerateAnalysisReportOutputSchema,
  },
  async (input) => {
    const { output } = await generateAnalysisReportPrompt({
        stats: JSON.stringify(input.stats, null, 2),
        recentLogs: JSON.stringify(input.recentLogs, null, 2)
    });
    return output!;
  }
);

/**
 * Wrapper Function for Server Action usage
 */
export async function generateAnalysisReport(
  input: GenerateAnalysisReportInput
): Promise<GenerateAnalysisReportOutput> {
  const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
  if (!rl.success) {
    throw new Error(`Rate limit exceeded. Please try again in ${rl.reset} seconds.`);
  }

  return generateAnalysisReportFlow(input);
}

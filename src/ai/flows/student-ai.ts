'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { queryVectorStore, generateEmbedding } from '@/lib/vector-store';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { extractTextFromPDF } from '@/lib/pdf-service';
import { getStudentMetricsAction, getStudentDeadlinesAction } from '@/app/actions/student';
import { getCourses } from '@/app/actions/courses';

/**
 * AI Agent Tools
 */
const searchCourseMaterialsTool = ai.defineTool(
  {
    name: 'searchCourseMaterials',
    description: 'Searches through lecture notes and course materials for specific information.',
    inputSchema: z.object({ query: z.string(), courseId: z.string() }),
    outputSchema: z.string(),
  },
  async ({ query, courseId }) => {
    const results = await queryVectorStore('notes', query, { 'metadata.courseId': courseId });
    return results.map(r => `[Source: ${r.metadata.sourceTitle}] ${r.content}`).join('\n\n');
  }
);

const analyzePerformanceTool = ai.defineTool(
  {
    name: 'analyzePerformance',
    description: 'Analyzes the student performance, quiz ranks, and attendance.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    const metrics = await getStudentMetricsAction();
    return `Student Metrics: Rank: ${metrics?.quizRank || 'N/A'}, Attendance: ${metrics?.attendance || 'N/A'}. Recommendations: Focus on active participation.`;
  }
);

const generateStudyPlanTool = ai.defineTool(
  {
    name: 'generateStudyPlan',
    description: 'Generates a personalized study plan based on upcoming deadlines.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    const deadlines = await getStudentDeadlinesAction();
    const courses = await getCourses();
    return `Deadlines: ${JSON.stringify(deadlines)}. Enrolled in: ${courses.map((c: any) => c.title).join(', ')}.`;
  }
);

// --- Chat with Course ---
const ChatWithCourseInputSchema = z.object({
  courseId: z.string(),
  query: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
});

export const chatWithCourseFlow = ai.defineFlow(
  {
    name: 'chatWithCourseFlow',
    inputSchema: ChatWithCourseInputSchema,
    outputSchema: z.object({
      answer: z.string(),
      citations: z.array(z.object({
        sourceTitle: z.string(),
        page: z.number().optional(),
        content: z.string(),
      })).optional(),
    }),
  },
  async (input) => {
    const { output } = await ai.generate({
      tools: [searchCourseMaterialsTool, analyzePerformanceTool, generateStudyPlanTool],
      messages: [
        { role: 'user', content: [{ text: `You are a comprehensive Academic Student Assistant. 
        You have access to the student's courses, performance metrics, and study plans.
        
        Your goals:
        1. Answer questions about course materials (use searchCourseMaterials tool).
        2. Provide performance insights (use analyzePerformance tool).
        3. Help with study planning and strategy (use generateStudyPlan tool).
        4. Always be study-focused, professional, and encouraging.
        
        The current course context is: ${input.courseId}. 
        If the student asks about other things or general studies, use your tools to help.` } ] },
        ...(input.history || []),
        { role: 'user', content: [{ text: input.query }] }
      ],
    });

    return {
      answer: output?.text() || "I'm sorry, I couldn't process your request.",
    };
  }
);

// --- Lecture Summarization ---
const SummarizeLectureInputSchema = z.object({
  noteId: z.string(),
  content: z.string(),
});

export const summarizeLectureFlow = ai.defineFlow(
  {
    name: 'summarizeLectureFlow',
    inputSchema: SummarizeLectureInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Summarize the following lecture notes into a structured format.
      Include:
      - Key Concepts
      - Formulas/Definitions (if any)
      - Summary Paragraph
      
      CONTENT:
      ${input.content}`,
    });
    return output?.text() || "Summary failed.";
  }
);

// --- Performance Insights ---
const GetPerformanceInsightsInputSchema = z.object({
  studentId: z.string(),
  attempts: z.array(z.any()),
});

export const getPerformanceInsightsFlow = ai.defineFlow(
  {
    name: 'getPerformanceInsightsFlow',
    inputSchema: GetPerformanceInsightsInputSchema,
    outputSchema: z.object({
      summary: z.string(),
      recommendations: z.array(z.string()),
      status: z.enum(['excellent', 'good', 'needs_improvement', 'at_risk']),
    }),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Analyze the student's quiz performance data and provide insights.
      
      DATA:
      ${JSON.stringify(input.attempts)}
      
      Return a JSON object with:
      - summary (string)
      - recommendations (array of strings)
      - status (one of: excellent, good, needs_improvement, at_risk)`,
      output: { format: 'json' }
    });
    return output as any;
  }
);

// --- Study Plan Generation ---
const GenerateStudyPlanInputSchema = z.object({
  studentId: z.string(),
  deadlines: z.array(z.any()),
  enrolledCourses: z.array(z.string()),
});

export const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Create a weekly study plan for a student based on their courses and upcoming deadlines.
      
      COURSES: ${input.enrolledCourses.join(', ')}
      DEADLINES: ${JSON.stringify(input.deadlines)}
      
      Format the plan in Markdown.`,
    });
    return output?.text() || "Failed to generate study plan.";
  }
);

/**
 * Server Actions Wrappers
 */

export async function chatWithCourseAction(input: z.infer<typeof ChatWithCourseInputSchema>) {
  return createAction({
    name: 'chatWithCourseAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async () => {
      const rl = await checkRateLimit({ limit: 10, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error('Rate limit exceeded');
      return chatWithCourseFlow(input);
    }
  }, {});
}

export async function summarizeLectureAction(input: z.infer<typeof SummarizeLectureInputSchema>) {
  return createAction({
    name: 'summarizeLectureAction',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER],
    handler: async () => {
      const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error('Rate limit exceeded');
      return summarizeLectureFlow(input);
    }
  }, {});
}

export async function getPerformanceInsightsAction(input: z.infer<typeof GetPerformanceInsightsInputSchema>) {
  return createAction({
    name: 'getPerformanceInsightsAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async () => {
      const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error('Rate limit exceeded');
      return getPerformanceInsightsFlow(input);
    }
  }, {});
}

export async function generateStudyPlanAction(input: z.infer<typeof GenerateStudyPlanInputSchema>) {
  return createAction({
    name: 'generateStudyPlanAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async () => {
      const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error('Rate limit exceeded');
      return generateStudyPlanFlow(input);
    }
  }, {});
}

export async function chatWithPDFAction(formData: FormData) {
  return createAction({
    name: 'chatWithPDFAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async () => {
      const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error('Rate limit exceeded');

      const file = formData.get('file') as File;
      const query = formData.get('query') as string;
      const historyJson = formData.get('history') as string;
      const history = historyJson ? JSON.parse(historyJson) : [];

      if (!file || !query) throw new Error('Missing file or query');

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractTextFromPDF(buffer);

      // Simple context window: Take first 5000 chars or implement better chunking
      const context = text.slice(0, 10000); 

      const { output } = await ai.generate({
        messages: [
          ...(history || []),
          { role: 'user', content: [{ text: `You are an academic study assistant. 
        A student has uploaded a PDF document and asked a question.
        Use the provided text from the PDF as context to provide an OPTIMAL, accurate, and study-focused answer.
        
        CONTEXT FROM PDF:
        ${context}
        
        STUDENT QUERY:
        ${query}` }] }
        ],
      });

      return {
        answer: output?.text() || "I couldn't process the document.",
        citations: [{ sourceTitle: file.name, content: 'Uploaded Document' }]
      };
    }
  }, {});
}

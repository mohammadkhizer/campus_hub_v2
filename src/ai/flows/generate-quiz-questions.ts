'use server';
/**
 * @fileOverview A Genkit flow for generating quiz questions and answer choices based on provided text or topic keywords.
 *
 * - generateQuizQuestions - A function that handles the quiz question generation process.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateQuizQuestionsInputSchema = z
  .object({
    contextText: z
      .string()
      .optional()
      .describe(
        'Optional: The text from which to generate quiz questions. If provided, the AI will use this as the primary source.'
      ),
    topicKeywords: z
      .array(z.string())
      .optional()
      .describe(
        'Optional: A list of keywords to guide the AI in generating questions. Useful if no context text is provided.'
      ),
    numQuestions: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(5)
      .describe('The number of quiz questions to generate (between 1 and 10).'),
    difficulty: z
      .enum(['easy', 'medium', 'hard'])
      .default('medium')
      .describe('The difficulty level of the generated questions.'),
  })
  .refine(
    data => data.contextText || (data.topicKeywords && data.topicKeywords.length > 0),
    'Either contextText or at least one topicKeyword must be provided.'
  );

export type GenerateQuizQuestionsInput = z.infer<
  typeof GenerateQuizQuestionsInputSchema
>;

const QuizQuestionSchema = z.object({
  type: z.enum(['mcq', 'fill-in-the-blanks', 'short-answer', 'long-answer']).default('mcq'),
  questionText: z
    .string()
    .describe('The text of the generated quiz question.'),
  answerChoices: z
    .array(z.string())
    .optional()
    .describe(
      'An array of exactly 4 possible answer choices for MCQ questions.'
    ),
  correctAnswer: z
    .string()
    .describe('The correct answer choice or the blank value.'),
  explanation: z
    .string()
    .optional()
    .describe('An optional explanation for the correct answer.'),
});

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe('An array of generated quiz questions.'),
});

export type GenerateQuizQuestionsOutput = z.infer<
  typeof GenerateQuizQuestionsOutputSchema
>;

// Prompt Definition
const generateQuizQuestionsPrompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {schema: GenerateQuizQuestionsInputSchema},
  output: {schema: GenerateQuizQuestionsOutputSchema},
  prompt: `You are an expert quiz question generator. Your task is to create {{numQuestions}} quiz questions based on the provided information, at a "{{difficulty}}" difficulty level.
  
You can generate a mix of the following types:
1. "mcq": Multiple choice with 4 options.
2. "fill-in-the-blanks": A sentence with a blank.
3. "short-answer": A question requiring a short text answer.
4. "long-answer": A question requiring a detailed explanation.

{{#if contextText}}
Use the following text as the primary source of information:
{{{contextText}}}
{{/if}}

{{#if topicKeywords}}
Focus on the following topics/keywords:
{{#each topicKeywords}}- {{{this}}}
{{/each}}
{{/if}}

For each question:
1.  Provide the "type".
2.  Provide the "questionText".
3.  For "mcq", provide exactly 4 "answerChoices" and the "correctAnswer".
4.  For "fill-in-the-blanks", provide the "questionText" with a "_______" placeholder and the "correctAnswer".
5.  For "short-answer" and "long-answer", provide the "questionText" and a model "correctAnswer".
6.  (Optional) Provide an "explanation" for the correct answer.

The output should be a JSON array of questions, adhering strictly to the provided output schema.`,
});

// Flow Definition
const generateQuizQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionsFlow',
    inputSchema: GenerateQuizQuestionsInputSchema,
    outputSchema: GenerateQuizQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuizQuestionsPrompt(input);
    return output!;
  }
);

// Wrapper Function
import { checkRateLimit } from '@/lib/rate-limit';

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  // Check Rate Limit (e.g., 2 requests per minute)
  const rl = await checkRateLimit({ limit: 2, windowMs: 60 * 1000 });
  if (!rl.success) {
    throw new Error(`Rate limit exceeded. Please try again in ${rl.reset} seconds.`);
  }

  return generateQuizQuestionsFlow(input);
}

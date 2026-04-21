'use server';

import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import type {
  GenerateQuizQuestionsInput,
  GenerateQuizQuestionsOutput,
} from '@/ai/flows/generate-quiz-questions';

export { type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput };

export async function generateQuizQuestionsAction(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestions(input);
}

import { describe, it, expect } from 'vitest';

describe('Quiz Attempt & Score Calculation', () => {
  it('calculates score percentage correctly', () => {
    const calculateScore = (correctAnswers: number, totalQuestions: number) => {
      if (totalQuestions === 0) return 0;
      return Math.round((correctAnswers / totalQuestions) * 100);
    };

    expect(calculateScore(8, 10)).toBe(80);
    expect(calculateScore(10, 10)).toBe(100);
    expect(calculateScore(0, 5)).toBe(0);
  });

  it('determines passing status based on 60% threshold', () => {
    const isPassing = (scorePercent: number) => scorePercent >= 60;

    expect(isPassing(80)).toBe(true);
    expect(isPassing(60)).toBe(true);
    expect(isPassing(59)).toBe(false);
  });
});

import { correlationLogger } from '@/lib/correlation-logger';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  role?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

/**
 * Campus Hub Structured Analytics Event Tracker
 * Telemetry sink for product usage, conversion funnel, and question-level metrics.
 */
export class EventTracker {
  static track(event: AnalyticsEvent) {
    const timestamp = event.timestamp || new Date().toISOString();
    
    correlationLogger.info(`[Analytics Event] ${event.eventName}`, {
      eventName: event.eventName,
      userId: event.userId,
      role: event.role,
      properties: event.properties,
      timestamp,
    });

    // PostHog / Amplitude dispatch stub (runs when telemetry key present)
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event.eventName, {
        userId: event.userId,
        role: event.role,
        ...event.properties,
      });
    }
  }

  static trackFunnelStep(stepName: 'signup' | 'first_login' | 'quiz_start' | 'quiz_completion', userId: string, extra?: Record<string, any>) {
    this.track({
      eventName: `funnel_${stepName}`,
      userId,
      properties: {
        step: stepName,
        ...extra,
      },
    });
  }

  static trackQuestionAttempt(quizId: string, questionId: string, isCorrect: boolean, timeSpentSeconds: number, userId: string) {
    this.track({
      eventName: 'question_attempted',
      userId,
      properties: {
        quizId,
        questionId,
        isCorrect,
        timeSpentSeconds,
      },
    });
  }
}

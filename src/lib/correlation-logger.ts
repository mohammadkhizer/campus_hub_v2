import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  action?: string;
  path?: string;
  [key: string]: any;
}

export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class CorrelationLogger {
  private formatLog(level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY', message: string, context: LogContext = {}) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      correlationId: context.correlationId || generateCorrelationId(),
      ...context,
    };
    return JSON.stringify(payload);
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context));
  }

  security(message: string, context?: LogContext) {
    console.warn(this.formatLog('SECURITY', message, context));
  }
}

export const correlationLogger = new CorrelationLogger();

/**
 * @fileOverview A simple structured logger for security and application events.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  context?: Record<string, any>;
}

class Logger {
  maskSensitiveData(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return context;
    const sensitiveKeys = ['password', 'token', 'secret', 'email', 'contactNumber', 'enrollmentNumber'];
    const masked = { ...context };
    
    const maskString = (str: string) => {
      if (str.length <= 4) return '****';
      return `${str.substring(0, 2)}****${str.substring(str.length - 2)}`;
    };

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k)) && typeof masked[key] === 'string') {
        masked[key] = maskString(masked[key]);
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]); // Recursive masking
      }
    }
    return masked;
  }

  format(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: context?.correlationId || context?.requestId,
      context: this.maskSensitiveData(context),
    };
  }

  async log(entry: LogEntry) {
    const output = JSON.stringify(entry);
    if (entry.level === 'error' || entry.level === 'security') {
      console.error(output);
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }

    // Persist to Database for important logs
    if (['error', 'security', 'warn'].includes(entry.level) || entry.context?.persist) {
      try {
        // Dynamic import to avoid circular dependencies and ensure it only runs on server
        const dbConnect = (await import('./mongoose')).default;
        const SystemLog = (await import('@/models/SystemLog')).default;
        
        await dbConnect();
        await SystemLog.create({
          level: entry.level,
          message: entry.message,
          requestId: entry.requestId,
          context: entry.context,
          timestamp: new Date(entry.timestamp)
        });
      } catch (dbErr) {
        // Fallback if DB logging fails - don't throw to avoid crashing the main process
        console.error('CRITICAL: Log persistence failed', dbErr);
      }
    }
  }

  async info(message: string, context?: Record<string, any>) {
    await this.log(this.format('info', message, context));
  }

  async warn(message: string, context?: Record<string, any>) {
    await this.log(this.format('warn', message, context));
  }

  async error(message: string, context?: Record<string, any>) {
    await this.log(this.format('error', message, context));
  }

  async security(message: string, context?: Record<string, any>) {
    await this.log(this.format('security', `[SECURITY] ${message}`, context));
  }
}

export const logger = new Logger();

/**
 * @fileOverview A simple structured logger for security and application events.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private format(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private async log(entry: LogEntry) {
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

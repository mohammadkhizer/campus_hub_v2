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
      // Persist critical logs to DB asynchronously
      this.persistToDB(entry);
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private async persistToDB(entry: LogEntry) {
    try {
      const LogModel = (await import('@/models/Log')).default;
      await LogModel.create({
        ...entry,
        timestamp: new Date(entry.timestamp)
      });
    } catch (e) {
      // Fail silently to prevent logging errors from crashing the app
    }
  }


  info(message: string, context?: Record<string, any>) {
    this.log(this.format('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(this.format('warn', message, context));
  }

  error(message: string, context?: Record<string, any>) {
    this.log(this.format('error', message, context));
  }

  security(message: string, context?: Record<string, any>) {
    this.log(this.format('security', `[SECURITY] ${message}`, context));
  }
}

export const logger = new Logger();

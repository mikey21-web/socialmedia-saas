import { Injectable, LoggerService, Scope } from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  requestId?: string;
  teamId?: string;
  userId?: string;
  module?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: { name: string; message: string; stack?: string };
}

/**
 * Structured JSON logger that outputs one JSON line per log.
 * Easily ingested by Datadog, CloudWatch, Loki, etc.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger implements LoggerService {
  private context: LogContext = {};

  setContext(ctx: LogContext): this {
    this.context = { ...this.context, ...ctx };
    return this;
  }

  child(extraContext: LogContext): StructuredLogger {
    const child = new StructuredLogger();
    child.context = { ...this.context, ...extraContext };
    return child;
  }

  log(message: string, context?: LogContext): void {
    this.write('info', message, undefined, context);
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, undefined, context);
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, undefined, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, undefined, context);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    this.write('error', message, error, context);
  }

  fatal(message: string, error?: unknown, context?: LogContext): void {
    this.write('fatal', message, error, context);
  }

  verbose(message: string, context?: LogContext): void {
    this.write('debug', message, undefined, context);
  }

  private write(level: LogLevel, message: string, error?: unknown, extraContext?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...extraContext },
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error !== undefined) {
      entry.error = { name: 'Unknown', message: String(error) };
    }

    const output = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(`${output}\n`);
    } else {
      process.stdout.write(`${output}\n`);
    }
  }
}

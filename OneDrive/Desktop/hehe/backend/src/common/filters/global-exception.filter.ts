import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

type RequestWithUser = Request & {
  user?: {
    userId?: string;
    team_id?: string;
  };
};

type PrismaLikeError = Error & { code?: string };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();
    const statusCode = this.getStatusCode(exception);
    const code = this.getCode(exception, statusCode);
    const error = this.getErrorMessage(exception);

    if (statusCode >= 500) {
      Sentry.captureException(exception, {
        extra: {
          userId: request.user?.userId,
          teamId: request.user?.team_id,
          path: request.url,
        },
      });
      this.logger.error({
        userId: request.user?.userId,
        teamId: request.user?.team_id,
        endpoint: `${request.method} ${request.originalUrl ?? request.url}`,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: process.env.NODE_ENV !== 'production' && exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(statusCode).json({
      error,
      code,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });
  }

  private getStatusCode(exception: unknown) {
    if (exception instanceof HttpException) return exception.getStatus();
    const prismaError = exception as PrismaLikeError;
    if (prismaError.code === 'P2002') return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getCode(exception: unknown, statusCode: number) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const maybeCode = (response as Record<string, unknown>).code;
        if (typeof maybeCode === 'string') return maybeCode;
      }
    }
    const prismaError = exception as PrismaLikeError;
    if (prismaError.code === 'P2002') return 'UNIQUE_CONSTRAINT';
    return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR';
  }

  private getErrorMessage(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null) {
        const message = (response as Record<string, unknown>).message;
        if (Array.isArray(message)) return message.join(', ');
        if (typeof message === 'string') return message;
        const error = (response as Record<string, unknown>).error;
        if (typeof error === 'string') return error;
      }
      return exception.message;
    }
    if (exception instanceof Error) return exception.message;
    return 'Internal server error';
  }
}

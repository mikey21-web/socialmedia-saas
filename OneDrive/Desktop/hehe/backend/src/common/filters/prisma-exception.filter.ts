import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
type PrismaLikeError = Error & {
  code?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = exception.message;
      let error: unknown = exceptionResponse;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseBody = exceptionResponse as { message?: string | string[]; error?: string };
        message = Array.isArray(responseBody.message)
          ? responseBody.message.join(', ')
          : responseBody.message ?? exception.message;
        error = responseBody.error ?? exceptionResponse;
      }

      response.status(status).json({ statusCode: status, message, error });
      return;
    }

    const prismaError = exception as PrismaLikeError;

    if (prismaError.code === 'P2002') {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Unique constraint violation',
        error: 'UNIQUE_CONSTRAINT',
      });
      return;
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}

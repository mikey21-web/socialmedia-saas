import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let error: unknown = exceptionResponse;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseBody = exceptionResponse as { message?: string | string[]; error?: string };
      message = Array.isArray(responseBody.message)
        ? responseBody.message.join(', ')
        : responseBody.message ?? exception.message;
      error = responseBody.error ?? exceptionResponse;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}

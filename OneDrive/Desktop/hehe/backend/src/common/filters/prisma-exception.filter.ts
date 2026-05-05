import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
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

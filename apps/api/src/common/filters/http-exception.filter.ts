import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse } from '@repo/shared-types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message || message;
      if (Array.isArray(respObj.message)) {
        details = { validation: respObj.message };
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: (HttpStatus[status] as string) || 'Internal Server Error',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      details,
    };

    response.status(status).json(errorPayload);
  }
}

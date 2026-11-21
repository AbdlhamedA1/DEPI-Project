import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@repo/shared-types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map(data => ({
        success: true,
        statusCode,
        message: 'Operation completed successfully',
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
          version: 'v1',
        },
      })),
    );
  }
}

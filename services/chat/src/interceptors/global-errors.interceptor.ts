import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class GlobalErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((err) => {
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let extracted: string | string[] = 'Internal server error';

        if (err instanceof HttpException) {
          status = err.getStatus();
          const res = err.getResponse();
          if (typeof res === 'string') {
            extracted = res;
          } else if (typeof res === 'object' && res !== null) {
            const payload = res as Record<string, unknown>;
            const value = payload['message'] ?? payload['error'] ?? err.message;
            if (Array.isArray(value)) {
              extracted = value.map((m) => String(m));
            } else if (typeof value === 'string') {
              extracted = value;
            } else {
              extracted = 'Unexpected error';
            }
          } else {
            extracted = err.message;
          }
        } else if (err instanceof Error) {
          extracted = err.message;
        }

        const responseBody = { message: extracted };
        return throwError(() => new HttpException(responseBody, status));
      }),
    );
  }
}

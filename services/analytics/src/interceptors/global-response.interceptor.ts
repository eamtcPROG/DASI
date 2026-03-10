import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map } from 'rxjs/operators';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { ResultListDto } from '../dto/resultlist.dto';

function isAlreadyWrapped(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const payload = data as Record<string, unknown>;
  const hasCommon: unknown =
    Object.prototype.hasOwnProperty.call(payload, 'error') &&
    Object.prototype.hasOwnProperty.call(payload, 'htmlcode') &&
    Object.prototype.hasOwnProperty.call(payload, 'messages');
  if (!hasCommon) return false;
  return (Object.prototype.hasOwnProperty.call(payload, 'object') ||
    Object.prototype.hasOwnProperty.call(payload, 'objects')) as boolean;
}

function extractListEnvelope(
  data: unknown,
): { objects: unknown[]; total: number; totalpages: number } | null {
  if (!data || typeof data !== 'object') return null;
  const payload = data as Record<string, unknown>;
  const rawObjects = Array.isArray(payload['objects'])
    ? (payload['objects'] as unknown[])
    : Array.isArray(payload['items'])
      ? (payload['items'] as unknown[])
      : null;
  const totalVal = payload['total'];
  const totalPagesVal = payload['totalpages'];
  if (
    rawObjects &&
    typeof totalVal === 'number' &&
    typeof totalPagesVal === 'number'
  ) {
    return {
      objects: rawObjects,
      total: totalVal,
      totalpages: totalPagesVal,
    };
  }
  return null;
}

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        const statusCode = response?.statusCode ?? 200;

        if (isAlreadyWrapped(data)) {
          return data;
        }

        const envelope = extractListEnvelope(data);
        if (envelope) {
          return new ResultListDto<unknown>(
            envelope.objects,
            envelope.total,
            envelope.totalpages,
            false,
            statusCode,
          );
        }

        if (Array.isArray(data)) {
          return new ResultListDto<unknown>(
            data,
            data.length,
            1,
            false,
            statusCode,
          );
        }

        return new ResultObjectDto<unknown>(data ?? null, false, statusCode);
      }),
    );
  }
}

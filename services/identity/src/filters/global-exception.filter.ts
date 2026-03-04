import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { MessageDto, MessageType } from '../dto/message.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: MessageDto[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        messages = [new MessageDto(res, MessageType.ERROR)];
      } else if (typeof res === 'object' && res !== null) {
        const payload = res as Record<string, unknown>;
        const extracted =
          payload['message'] ?? payload['error'] ?? exception.message;
        if (Array.isArray(extracted)) {
          messages = extracted.map(
            (m) => new MessageDto(String(m), MessageType.ERROR),
          );
        } else if (typeof extracted === 'string') {
          messages = [new MessageDto(extracted, MessageType.ERROR)];
        } else {
          messages = [new MessageDto('Unexpected error', MessageType.ERROR)];
        }
      } else {
        messages = [new MessageDto(exception.message, MessageType.ERROR)];
      }
    } else if (exception instanceof Error) {
      messages = [new MessageDto(exception.message, MessageType.ERROR)];
    } else {
      messages = [new MessageDto('Internal server error', MessageType.ERROR)];
    }

    const result = new ResultObjectDto<unknown>(null, true, status, messages);
    response.status(status).json(result);
  }
}

import {
  BadRequestException,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { throwError, lastValueFrom } from 'rxjs';
import { GlobalErrorsInterceptor } from './global-errors.interceptor';

describe('GlobalErrorsInterceptor', () => {
  const interceptor = new GlobalErrorsInterceptor();
  const context = {} as never;

  const runWithError = async (error: unknown): Promise<HttpException> => {
    const next: CallHandler = {
      handle: () => throwError(() => error),
    };

    try {
      await lastValueFrom(interceptor.intercept(context, next));
      throw new Error('Expected interceptor to throw');
    } catch (caught) {
      return caught as HttpException;
    }
  };

  it('preserves status and string payload from HttpException', async () => {
    const exception = await runWithError(
      new BadRequestException('Invalid body'),
    );

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({ message: 'Invalid body' });
  });

  it('maps array message payloads from HttpException objects', async () => {
    const exception = await runWithError(
      new HttpException({ message: ['a', 'b'] }, 422),
    );

    expect(exception.getStatus()).toBe(422);
    expect(exception.getResponse()).toEqual({ message: ['a', 'b'] });
  });

  it('maps standard Error to internal server error response', async () => {
    const exception = await runWithError(new Error('boom'));

    expect(exception.getStatus()).toBe(500);
    expect(exception.getResponse()).toEqual({ message: 'boom' });
  });

  it('maps unknown errors to default internal server error message', async () => {
    const exception = await runWithError('unknown');

    expect(exception.getStatus()).toBe(500);
    expect(exception.getResponse()).toEqual({
      message: 'Internal server error',
    });
  });
});

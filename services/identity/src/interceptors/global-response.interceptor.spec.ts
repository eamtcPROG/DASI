import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResultListDto } from '../dto/resultlist.dto';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { GlobalResponseInterceptor } from './global-response.interceptor';

describe('GlobalResponseInterceptor', () => {
  const interceptor = new GlobalResponseInterceptor();

  const createContext = (statusCode = 200): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    }) as ExecutionContext;

  const createCallHandler = (data: unknown): CallHandler => ({
    handle: () => of(data),
  });

  it('returns payload as-is when already wrapped', async () => {
    const wrapped = {
      error: false,
      htmlcode: 200,
      messages: [],
      object: { id: 1 },
    };

    const result = await lastValueFrom(
      interceptor.intercept(createContext(), createCallHandler(wrapped)),
    );

    expect(result).toBe(wrapped);
  });

  it('wraps list envelopes into ResultListDto and preserves metadata', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        createContext(201),
        createCallHandler({ objects: [{ id: 1 }], total: 8, totalpages: 3 }),
      ),
    );

    expect(result).toBeInstanceOf(ResultListDto);
    expect(result).toMatchObject({
      error: false,
      htmlcode: 201,
      objects: [{ id: 1 }],
      total: 8,
      totalpages: 3,
    });
  });

  it('wraps arrays into ResultListDto with computed totals', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext(), createCallHandler([1, 2, 3])),
    );

    expect(result).toBeInstanceOf(ResultListDto);
    expect(result).toMatchObject({
      objects: [1, 2, 3],
      total: 3,
      totalpages: 1,
      htmlcode: 200,
    });
  });

  it('wraps non-array payloads into ResultObjectDto', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        createContext(202),
        createCallHandler({ foo: 'bar' }),
      ),
    );

    expect(result).toBeInstanceOf(ResultObjectDto);
    expect(result).toMatchObject({
      object: { foo: 'bar' },
      htmlcode: 202,
      error: false,
    });
  });

  it('maps undefined payload to ResultObjectDto with null object', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext(), createCallHandler(undefined)),
    );

    expect(result).toBeInstanceOf(ResultObjectDto);
    expect(result).toMatchObject({ object: null, error: false, htmlcode: 200 });
  });
});

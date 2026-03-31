import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';

type MessageItem = { message: string };
type ResultObjectBody<T> = {
  error: boolean;
  htmlcode?: number;
  messages?: MessageItem[];
  object: T;
};

type ResultListBody<T> = {
  error: boolean;
  htmlcode?: number;
  messages?: MessageItem[];
  objects: T[];
  total: number;
  totalpages: number;
};

type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthObject = {
  access_token: string;
  user: AuthUser;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function asMessages(value: unknown): MessageItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asRecord(entry))
    .map((entry) => ({
      message: typeof entry['message'] === 'string' ? entry['message'] : '',
    }));
}

function asResultObject<T>(value: unknown): ResultObjectBody<T> {
  const body = asRecord(value);
  return {
    error: Boolean(body['error']),
    htmlcode:
      typeof body['htmlcode'] === 'number' ? body['htmlcode'] : undefined,
    messages: asMessages(body['messages']),
    object: body['object'] as T,
  };
}

function asResultList<T>(value: unknown): ResultListBody<T> {
  const body = asRecord(value);
  return {
    error: Boolean(body['error']),
    htmlcode:
      typeof body['htmlcode'] === 'number' ? body['htmlcode'] : undefined,
    messages: asMessages(body['messages']),
    objects: Array.isArray(body['objects']) ? (body['objects'] as T[]) : [],
    total: typeof body['total'] === 'number' ? body['total'] : 0,
    totalpages: typeof body['totalpages'] === 'number' ? body['totalpages'] : 0,
  };
}

describe('User API (e2e)', () => {
  let app: INestApplication<App>;

  const uniqueEmail = () =>
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /user/sign-up', () => {
    it('creates a user and returns access_token and user', async () => {
      const email = uniqueEmail();
      const body = {
        email,
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const res = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send(body)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const result = asResultObject<AuthObject>(res.body);
      expect(result.error).toBe(false);
      expect(result.object).toBeDefined();
      expect(result.object.access_token).toBeDefined();
      expect(result.object.user).toBeDefined();
      expect(result.object.user.email).toBe(email.toLowerCase());
      expect(result.object.user.firstName).toBe('John');
      expect(result.object.user.lastName).toBe('Doe');
      expect(result.object.user.id).toBeDefined();
    });

    it('returns 400 when email or password is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send({})
        .expect(400);

      const result = asResultObject<Record<string, unknown>>(res.body);
      expect(result.error).toBe(true);
      expect(result.htmlcode).toBe(400);
      expect(result.messages).toBeDefined();
      expect(
        result.messages?.some((m) =>
          m.message.toLowerCase().includes('required'),
        ),
      ).toBe(true);
    });

    it('returns 400 when email is already in use', async () => {
      const email = uniqueEmail();
      const body = {
        email,
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/user/sign-up')
        .send(body)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const res = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send(body)
        .expect(400);

      const result = asResultObject<Record<string, unknown>>(res.body);
      expect(result.error).toBe(true);
      expect(result.messages).toBeDefined();
      expect(
        result.messages?.some((m) =>
          m.message.includes('Email already in use'),
        ),
      ).toBe(true);
    });
  });

  describe('POST /user/sign-in', () => {
    it('signs in with valid credentials and returns access_token and user', async () => {
      const email = uniqueEmail();
      const password = 'password123';
      await request(app.getHttpServer())
        .post('/user/sign-up')
        .send({
          email,
          password,
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const res = await request(app.getHttpServer())
        .post('/user/sign-in')
        .send({ email, password })
        .expect(200);

      const result = asResultObject<AuthObject>(res.body);
      expect(result.error).toBe(false);
      expect(result.object.access_token).toBeDefined();
      expect(result.object.user).toBeDefined();
      expect(result.object.user.email).toBe(email.toLowerCase());
    });

    it('returns 401 for invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/user/sign-in')
        .send({
          email: 'nonexistent@test.local',
          password: 'wrong',
        })
        .expect(401);

      const result = asResultObject<Record<string, unknown>>(res.body);
      expect(result.error).toBe(true);
      expect(result.messages).toBeDefined();
      expect(
        result.messages?.some((m) => m.message.includes('Invalid credentials')),
      ).toBe(true);
    });
  });

  describe('GET /user/refresh', () => {
    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer()).get('/user/refresh').expect(401);
    });

    it('returns 200 with new token and user when Bearer token is valid', async () => {
      const email = uniqueEmail();
      const password = 'password123';
      const signUpRes = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send({
          email,
          password,
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const signUpResult = asResultObject<AuthObject>(signUpRes.body);
      const token = signUpResult.object.access_token;

      const res = await request(app.getHttpServer())
        .get('/user/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const result = asResultObject<AuthObject>(res.body);
      expect(result.error).toBe(false);
      expect(result.object.access_token).toBeDefined();
      expect(result.object.user).toBeDefined();
      expect(result.object.user.email).toBe(email.toLowerCase());
    });
  });

  describe('GET /user/', () => {
    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer()).get('/user/').expect(401);
    });

    it('returns 200 with objects, total, totalpages when Bearer token is valid', async () => {
      const email = uniqueEmail();
      const password = 'password123';
      const signUpRes = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send({
          email,
          password,
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      const signUpResult = asResultObject<AuthObject>(signUpRes.body);
      const token = signUpResult.object.access_token;

      const res = await request(app.getHttpServer())
        .get('/user/')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const result = asResultList<AuthUser>(res.body);
      expect(result.error).toBe(false);
      expect(Array.isArray(result.objects)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.totalpages).toBe('number');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';

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

      expect(res.body.error).toBe(false);
      expect(res.body.object).toBeDefined();
      expect(res.body.object.access_token).toBeDefined();
      expect(res.body.object.user).toBeDefined();
      expect(res.body.object.user.email).toBe(email.toLowerCase());
      expect(res.body.object.user.firstName).toBe('John');
      expect(res.body.object.user.lastName).toBe('Doe');
      expect(res.body.object.user.id).toBeDefined();
    });

    it('returns 400 when email or password is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/user/sign-up')
        .send({})
        .expect(400);

      expect(res.body.error).toBe(true);
      expect(res.body.htmlcode).toBe(400);
      expect(res.body.messages).toBeDefined();
      expect(
        res.body.messages.some(
          (m: { message: string }) =>
            m.message && m.message.toLowerCase().includes('required'),
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

      expect(res.body.error).toBe(true);
      expect(res.body.messages).toBeDefined();
      expect(
        res.body.messages.some(
          (m: { message: string }) =>
            m.message && m.message.includes('Email already in use'),
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

      expect(res.body.error).toBe(false);
      expect(res.body.object.access_token).toBeDefined();
      expect(res.body.object.user).toBeDefined();
      expect(res.body.object.user.email).toBe(email.toLowerCase());
    });

    it('returns 401 for invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/user/sign-in')
        .send({
          email: 'nonexistent@test.local',
          password: 'wrong',
        })
        .expect(401);

      expect(res.body.error).toBe(true);
      expect(res.body.messages).toBeDefined();
      expect(
        res.body.messages.some(
          (m: { message: string }) =>
            m.message && m.message.includes('Invalid credentials'),
        ),
      ).toBe(true);
    });
  });

  describe('GET /user/refresh', () => {
    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/user/refresh')
        .expect(401);
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

      const token = signUpRes.body.object.access_token;

      const res = await request(app.getHttpServer())
        .get('/user/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.error).toBe(false);
      expect(res.body.object.access_token).toBeDefined();
      expect(res.body.object.user).toBeDefined();
      expect(res.body.object.user.email).toBe(email.toLowerCase());
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

      const token = signUpRes.body.object.access_token;

      const res = await request(app.getHttpServer())
        .get('/user/')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.error).toBe(false);
      expect(Array.isArray(res.body.objects)).toBe(true);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.totalpages).toBe('number');
    });
  });
});

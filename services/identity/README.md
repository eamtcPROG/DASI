# Identity Service

NestJS service responsible for user registration, sign-in, JWT issuance, and token validation. Other services can interact with it via **HTTP REST API** or **RabbitMQ message patterns**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Running the Service](#running-the-service)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [HTTP API](#http-api)
- [Authentication (JWT)](#authentication-jwt)
- [Message-Based API (RabbitMQ)](#message-based-api-rabbitmq)
- [Response Format](#response-format)
- [Swagger Documentation](#swagger-documentation)
- [Integration Guide for Other Services](#integration-guide-for-other-services)
- [Tests](#tests)

---

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (for user data)
- **RabbitMQ** (for event-driven token validation)

When running via Docker Compose from `services/`, PostgreSQL and RabbitMQ are started automatically.

---

## Running the Service

### Local development

1. From the **identity** directory:
   ```bash
   cd services/identity
   npm install
   ```

2. Ensure PostgreSQL and RabbitMQ are running (e.g. via `services/docker-compose.yaml`):
   ```bash
   cd services
   docker compose up -d postgres-identity rabbitmq
   ```

3. Copy or create env file and start the app:
   ```bash
   # env is loaded from env/.env.development
   npm run start:dev
   ```

   Default HTTP port: **3001**.

### With Docker Compose (full stack)

From the **services** directory:

```bash
docker compose up -d
```

Identity service will be at `http://localhost:3001`.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development with watch (uses `env/.env.development`) |
| `npm run start:prod` | Run production build (`node dist/main`) |
| `npm run build` | Build the NestJS app to `dist/` |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (requires DB and `env/.env.test`) |
| `npm run seed` | Seed database with default users (see [Database Seeding](#database-seeding)) |
| `npm run seed:run` | Run seed from compiled `dist/` (after `npm run build`) |
| `npm run lint` | Run ESLint with fix |

---

## Environment Variables

| Variable           | Description                    | Example                    |
|--------------------|--------------------------------|----------------------------|
| `NODE_ENV`         | Environment                    | `development`, `production`|
| `PORT`             | HTTP server port               | `3001`                     |
| `VERSION`          | API version (required; used in Swagger) | `1.0.0`                    |
| `POSTGRES_USER`    | PostgreSQL user                | `postgres`                 |
| `POSTGRES_PASSWORD`| PostgreSQL password            | `postgres`                 |
| `POSTGRES_DB`      | PostgreSQL database name      | `identity`                 |
| `DATABASE_HOST`    | PostgreSQL host                | `localhost`                |
| `DATABASE_PORT`    | PostgreSQL port                | `5432`                     |
| `JWT_SECRET`       | Secret used to sign JWTs       | **(required, keep secret)**|
| `JWT_EXPIRES_IN`   | Token TTL in seconds           | `3600`                     |
| `RABBITMQ_URI`     | RabbitMQ connection URL        | `amqp://localhost:5672`    |

Config is loaded from `env/.env.${NODE_ENV}` (e.g. `env/.env.development`). `PORT`, `VERSION`, and `RABBITMQ_URI` are required at startup.

---

## Database Seeding

To populate the database with default users, run:

```bash
npm run seed
```

This uses `env/.env.development` (or `NODE_ENV` if set). Seed users are created only if they do not already exist:

| Email | Password | Name |
|-------|----------|------|
| `admin@example.com` | `password123` | Admin User |
| `dev@example.com` | `password123` | Dev User |

---

## HTTP API

Base URL: `http://localhost:3001` (or your deployed host).

All **authenticated** endpoints require the header:

```http
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Path           | Auth required | Description              |
|--------|----------------|---------------|---------------------------|
| POST   | `/user/sign-up`| No            | Register a new user      |
| POST   | `/user/sign-in`| No            | Sign in, get JWT + user   |
| GET    | `/user/refresh`| Yes (JWT)     | Refresh access token     |
| GET    | `/user/`       | Yes (JWT)     | List users (paginated)   |

---

### POST `/user/sign-up` — Register

**Request body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "your-secure-password",
  "firstName": "John",
  "lastName": "Doe"
}
```

- `email` and `password` are **required**.
- `firstName` and `lastName` are optional (can be `null`).

**Success (200):** Returns same shape as sign-in (see below): `access_token` and `user`.

**Errors:**

- `400` — Email and password missing, or email already in use.

---

### POST `/user/sign-in` — Sign in

**Request body (JSON):**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Success (200):** Response wraps an object with:

- `access_token` — JWT to use in `Authorization: Bearer <token>`.
- `user` — `{ id, email, firstName, lastName }` (no password).

**Errors:**

- `400` — Missing email or password.
- `401` — Invalid credentials.

---

### GET `/user/refresh` — Refresh token

Requires a valid JWT in `Authorization: Bearer <token>`.

**Success (200):** New `access_token` and `user` (same shape as sign-in).

**Errors:**

- `401` — Invalid or missing token.

---

### GET `/user/` — List users

Requires a valid JWT. Returns a paginated list of users (e.g. first page, 10 items).

**Success (200):** List response with `objects` (array of users), `total`, `totalpages`, etc. (see [Response format](#response-format)).

---

## Authentication (JWT)

1. **Obtain a token:** Call `POST /user/sign-in` (or `POST /user/sign-up`) and read `access_token` from the response.
2. **Use the token:** Send it in every request to protected routes:
   ```http
   Authorization: Bearer <access_token>
   ```
3. **Refresh:** Before expiry, call `GET /user/refresh` with the same header to get a new token.

Token payload includes at least `sub` (user id) and `email`. Expiration is set by `JWT_EXPIRES_IN` (seconds).

---

## Message-Based API (RabbitMQ)

The identity service connects to RabbitMQ and consumes from the **`user`** queue. Other services can **validate a JWT** without calling HTTP by sending a message and reading the reply.

### Pattern: `validate_token`

**Request payload:**

```json
{
  "token": "<jwt_access_token>"
}
```

**Response:**

- **Valid token:**
  ```json
  {
    "isValid": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```
- **Invalid/missing token:**
  ```json
  {
    "isValid": false,
    "error": "Missing token" | "Invalid payload" | "User not found" | "Invalid token"
  }
  ```

Use this from another NestJS (or any) service that can send/receive messages to the same RabbitMQ `user` queue with the `validate_token` pattern.

---

## Response Format

### Single object (e.g. sign-in, sign-up, refresh)

```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    "access_token": "<jwt>",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "messages": []
}
```

### List (e.g. GET `/user/`)

```json
{
  "error": false,
  "htmlcode": 200,
  "objects": [ { "id": 1, "email": "...", "firstName": "...", "lastName": "..." } ],
  "messages": [],
  "total": 1,
  "totalpages": 1
}
```

### Error responses

On validation or auth errors, the same wrapper is used with `error: true`, appropriate `htmlcode` (e.g. 400, 401), and often `object: null` with `messages` describing the issue.

---

## Swagger Documentation

When the service is running, interactive API docs are available at:

**http://localhost:3001/api**

- **Title:** API Identity Service  
- **Description:** HTTP API for the Identity service — manage identities, authentication, and identity-related operations with versioned endpoints, validation, and standard error responses.

Use Swagger to try endpoints and see exact request/response schemas. Use **Authorize** to set a Bearer token for protected routes.

---

## Integration Guide for Other Services

- **User registration / login (UI or BFF):**  
  Use **HTTP**: `POST /user/sign-up`, `POST /user/sign-in`. Store or forward the `access_token` and send it as `Authorization: Bearer <token>` on subsequent requests.

- **Protecting your own API:**  
  Either:
  - **HTTP:** Call identity’s `GET /user/refresh` to validate (or parse JWT yourself if you share `JWT_SECRET` and validation rules), or  
  - **RabbitMQ:** Send a `validate_token` message with the client’s JWT and use the returned `isValid` and `user` to authorize the request.

- **Getting current user in Identity:**  
  Use the JWT on `GET /user/refresh` or `GET /user/`; the service resolves the user from the token.

- **Dependencies:**  
  Identity needs PostgreSQL and RabbitMQ. In Docker Compose, start `postgres-identity` and `rabbitmq` (and optionally the full stack) so the identity service can connect.

---

## Tests

```bash
# Unit tests
npm run test

# E2E tests (require DB and env)
NODE_ENV=test npm run test:e2e
```

E2E tests use `env/.env.test` and `test/jest-e2e.json`. Ensure PostgreSQL (and optionally RabbitMQ) are available for E2E runs.

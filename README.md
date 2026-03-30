# DASI

DASI is a multi-service platform composed of a Next.js client, a NestJS gateway, and NestJS domain services for identity and chat. The gateway is the main backend entry point, while identity and chat expose their own direct HTTP APIs and RabbitMQ microservice handlers for internal communication.

## Architecture overview

- `services/client`: Next.js 16 frontend with public auth pages and a protected chat page.
- `services/gateway`: NestJS 11 API gateway that exposes `/auth/*`, `/health`, and chat/realtime integration.
- `services/identity`: NestJS 11 auth and user service with PostgreSQL persistence and JWT handling.
- `services/chat`: NestJS 11 chat service with PostgreSQL and RabbitMQ.
- `services/notification`: NestJS 11 email service that consumes `send_email` messages from RabbitMQ and delivers them via SMTP (Resend, Gmail, or Ethereal for local preview).
- Shared infrastructure: RabbitMQ plus separate PostgreSQL instances for identity and chat.

Primary request flow:

1. The browser loads the Next.js client.
2. The client calls Next route handlers and server helpers.
3. Those helpers call the gateway over HTTP.
4. The gateway proxies requests to identity or chat over RabbitMQ RPC.
5. Identity and chat use their own databases and return the result to the gateway.

See `docs/architecture.md` for the full architecture guide, request flows, and topology diagrams.

## Service map

| Service | Stack | Default port | Responsibility | Documentation |
| --- | --- | --- | --- | --- |
| `services/client` | Next.js 16, React 19 | `3100` in local dev recommended | UI, auth forms, protected pages, gateway integration | `docs/architecture.md` |
| `services/gateway` | NestJS 11 | `3000` | Public API, JWT enforcement, RMQ proxying, health checks | `docs/architecture.md` |
| `services/identity` | NestJS 11, TypeORM, PostgreSQL | `3001` | Users, sign-up, sign-in, refresh, token validation, password reset | `services/identity/README.md` |
| `services/chat` | NestJS 11, TypeORM, PostgreSQL | `3003` | Chat rooms, messages, RMQ handlers | `services/chat/README.md` |
| `services/notification` | NestJS 11, Nodemailer | `3005` | Email delivery via SMTP, consumed from RabbitMQ `notification` queue | — |

## Repository layout

```text
.
├── docs/
│   └── architecture.md
├── services/
│   ├── client/
│   ├── gateway/
│   ├── identity/
│   ├── chat/
│   ├── notification/
│   ├── docker-compose.dev.yaml
│   ├── docker-compose.test.yaml
│   └── docker-compose.yaml
└── README.md
```

## Prerequisites

- Node.js 22 or newer
- npm for backend services
- pnpm for the Next.js client
- Docker for PostgreSQL and RabbitMQ

## Quick start

### 1. Start infrastructure

From `services/`, start the development infrastructure:

```bash
docker compose -f docker-compose.dev.yaml up -d
```

This starts:

- `postgres-identity` on `localhost:5432`
- `rabbitmq` on `localhost:5672`

### 2. Install dependencies

Install dependencies in each service directory:

```bash
cd services/identity && npm install
cd services/chat && npm install
cd services/gateway && npm install
cd services/notification && npm install
cd services/client && pnpm install
```

### 3. Start backend services

Run each NestJS service in a separate terminal:

```bash
cd services/identity && npm run start:dev
cd services/chat && npm run start:dev
cd services/gateway && npm run start:dev
cd services/notification && npm run start:dev
```

### 4. Start the client on a non-conflicting port

The client defaults to port `3000`, which conflicts with the gateway. Run it on `3100` during development:

```bash
cd services/client && npx next dev --port 3100
```

## Default local endpoints

| Endpoint | Purpose |
| --- | --- |
| `http://127.0.0.1:3100` | Next.js client |
| `http://127.0.0.1:3000` | Gateway API |
| `http://127.0.0.1:3000/api` | Gateway Swagger |
| `http://127.0.0.1:3001` | Identity service |
| `http://127.0.0.1:3001/api` | Identity Swagger |
| `http://127.0.0.1:3003` | Chat service |
| `http://127.0.0.1:3003/api` | Chat Swagger |
| `http://127.0.0.1:3005` | Notification service |

## Public API surface

The gateway is the intended backend entry point for the client and external consumers.

### Gateway routes

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `GET /auth/refresh`
- `GET /auth/users?page=&onPage=`
- `POST /auth/reset-password`
- `POST /auth/reset-password/confirm`
- `GET /health`

### Important routing note

The identity service exposes direct routes under `/user/*`, but the gateway remaps the public auth API under `/auth/*`. When integrating the platform through the gateway, use `/auth/*`, not `/user/*`.

## Development commands

### Backend services

Each NestJS backend supports:

- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

Additional identity utility:

- `npm run seed`

### Client

The Next.js client supports:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`

## Containerized stack

From `services/`, start the full production-style stack with one command:

```bash
docker compose up --build
```

This starts:

- `client` on `localhost:3100`
- `gateway` on `localhost:3000`
- `identity` on `localhost:3001`
- `chat` on `localhost:3003`
- `notification` on `localhost:3005`
- `postgres-identity` on `localhost:5432`
- `postgres-chat` on `localhost:5434`
- `rabbitmq` on `localhost:5672`
- `redis` on `localhost:6379`

## Testing notes

- Backend e2e tests require the test stack from `services/docker-compose.test.yaml`.
- The gateway includes realtime health metadata, but the realtime module currently reports `enabled: false`.

## Notification service configuration

The notification service sends emails via SMTP. Configure it in `services/notification/env/.env.*`.

| Variable | Description |
| --- | --- |
| `SMTP_PREVIEW` | Set to `true` to use Ethereal (fake SMTP) and log preview URLs — no credentials needed |
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.resend.com`) |
| `SMTP_PORT` | SMTP port (e.g. `465` for TLS, `587` for STARTTLS) |
| `SMTP_SECURE` | `true` for port 465, `false` for 587 |
| `SMTP_USER` | SMTP username (e.g. `resend` for Resend) |
| `SMTP_PASS` | SMTP password or API key |
| `SMTP_FROM` | Sender address (e.g. `DASI <no-reply@yourdomain.com>`) |

For local development without a domain, set `SMTP_PREVIEW=true` or use Resend with `SMTP_FROM=DASI <onboarding@resend.dev>` (emails will only be delivered to the Resend account owner's address).

## Additional documentation

- Platform architecture: `docs/architecture.md`
- Identity service: `services/identity/README.md`
- Chat service: `services/chat/README.md`
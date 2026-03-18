# DASI

DASI is a multi-service platform composed of a Next.js client, a NestJS gateway, and two NestJS domain services for identity and analytics. The gateway is the main backend entry point, while identity and analytics also expose their own direct HTTP APIs and RabbitMQ microservice handlers for internal communication.

## Architecture overview

- `services/client`: Next.js 16 frontend with public auth pages and a protected chat page.
- `services/gateway`: NestJS 11 API gateway that exposes `/auth/*`, `/analytics/*`, and `/health`.
- `services/identity`: NestJS 11 auth and user service with PostgreSQL persistence and JWT handling.
- `services/analytics`: NestJS 11 analytics service with PostgreSQL wiring and placeholder analytics responses.
- Shared infrastructure: RabbitMQ plus separate PostgreSQL instances for identity and analytics.

Primary request flow:

1. The browser loads the Next.js client.
2. The client calls Next route handlers and server helpers.
3. Those helpers call the gateway over HTTP.
4. The gateway proxies requests to identity or analytics over RabbitMQ RPC.
5. Identity and analytics use their own databases and return the result to the gateway.

See `docs/architecture.md` for the full architecture guide, request flows, and topology diagrams.

## Service map

| Service | Stack | Default port | Responsibility | Documentation |
| --- | --- | --- | --- | --- |
| `services/client` | Next.js 16, React 19 | `3100` in local dev recommended | UI, auth forms, protected pages, gateway integration | `docs/architecture.md` |
| `services/gateway` | NestJS 11 | `3000` | Public API, JWT enforcement, RMQ proxying, health checks | `docs/architecture.md` |
| `services/identity` | NestJS 11, TypeORM, PostgreSQL | `3001` | Users, sign-up, sign-in, refresh, token validation | `services/identity/README.md` |
| `services/analytics` | NestJS 11, TypeORM, PostgreSQL | `3002` | Analytics endpoints and RMQ handlers | `services/analytics/README.md` |

## Repository layout

```text
.
├── docs/
│   └── architecture.md
├── services/
│   ├── analytics/
│   ├── client/
│   ├── gateway/
│   ├── identity/
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
- `postgres-analytics` on `localhost:5433`
- `rabbitmq` on `localhost:5672`

### 2. Install dependencies

Install dependencies in each service directory:

```bash
cd services/identity && npm install
cd services/analytics && npm install
cd services/gateway && npm install
cd services/client && pnpm install
```

### 3. Start backend services

Run each NestJS service in a separate terminal:

```bash
cd services/identity && npm run start:dev
cd services/analytics && npm run start:dev
cd services/gateway && npm run start:dev
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
| `http://127.0.0.1:3002` | Analytics service |
| `http://127.0.0.1:3002/api` | Analytics Swagger |

## Public API surface

The gateway is the intended backend entry point for the client and external consumers.

### Gateway routes

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `GET /auth/refresh`
- `GET /auth/users?page=&onPage=`
- `GET /analytics/messages`
- `GET /analytics/users`
- `GET /analytics/general`
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
- `analytics` on `localhost:3002`
- `postgres-identity` on `localhost:5432`
- `postgres-analytics` on `localhost:5433`
- `rabbitmq` on `localhost:5672`
- `redis` on `localhost:6379`

## Testing notes

- Backend e2e tests require the test stack from `services/docker-compose.test.yaml`.
- The analytics service currently has placeholder analytics responses and may not yet have meaningful unit coverage.
- The gateway includes realtime health metadata, but the realtime module currently reports `enabled: false`.

## Additional documentation

- Platform architecture: `docs/architecture.md`
- Identity service: `services/identity/README.md`
- Analytics service: `services/analytics/README.md`
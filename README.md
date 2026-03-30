# DASI

DASI is a multi-service platform with a Next.js client, a NestJS gateway, and domain microservices for identity, chat, and analytics. The gateway is the primary API entry point and communicates with backend services over RabbitMQ.

## Architecture overview

- `services/client`: Next.js 16 frontend with auth, chat, and analytics pages.
- `services/gateway`: NestJS 11 API gateway exposing `/auth/*`, `/chat/*`, `/analytics/*`, and `/health`.
- `services/identity`: NestJS 11 identity/auth service with PostgreSQL persistence.
- `services/chat`: NestJS 11 chat service with PostgreSQL persistence.
- `services/analytics`: NestJS 11 analytics service with MongoDB persistence.
- Shared infrastructure: RabbitMQ plus Redis (gateway realtime support).

See `docs/architecture.md` for detailed request flows, queues, and deployment topology.

## Service map

| Service | Stack | Default port | Responsibility | Documentation |
| --- | --- | --- | --- | --- |
| `services/client` | Next.js 16, React 19 | `3100` (recommended in local dev) | UI, auth pages, protected chat/analytics pages, gateway integration | `docs/architecture.md` |
| `services/gateway` | NestJS 11 | `3000` | Public API, JWT enforcement, RabbitMQ proxying, health/realtime | `docs/architecture.md` |
| `services/identity` | NestJS 11, TypeORM, PostgreSQL | `3001` | Sign-up, sign-in, refresh, user listing, token validation | `services/identity/README.md` |
| `services/chat` | NestJS 11, TypeORM, PostgreSQL | `3003` | Chat rooms, room membership, messages | `services/chat/README.md` |
| `services/analytics` | NestJS 11, Mongoose, MongoDB | `3004` | Aggregated platform stats and activity buckets | `services/analytics/README.md` |

## Repository layout

```text
.
├── docs/
│   └── architecture.md
├── services/
│   ├── analytics/
│   ├── chat/
│   ├── client/
│   ├── gateway/
│   ├── identity/
│   ├── docker-compose.dev.yaml
│   ├── docker-compose.test.yaml
│   └── docker-compose.yaml
└── README.md
```

## Prerequisites

- Node.js 22+
- npm (backend services)
- pnpm (client)
- Docker (local infra/services)

## Local development

### 1) Install dependencies

```bash
cd services/identity && npm install
cd services/chat && npm install
cd services/analytics && npm install
cd services/gateway && npm install
cd services/client && pnpm install
```

### 2) Start only infrastructure (recommended for manual service development)

From `services/`, run:

```bash
docker compose -f docker-compose.yaml up -d postgres-identity postgres-chat mongo-analytics rabbitmq redis
```

### 3) Start backend services

Run each service in its own terminal:

```bash
cd services/identity && npm run start:dev
cd services/chat && npm run start:dev
cd services/analytics && npm run start:dev
cd services/gateway && npm run start:dev
```

### 4) Start client on a non-conflicting port

Gateway and Next.js both default to `3000`, so run the client on `3100`:

```bash
cd services/client && npx next dev --port 3100
```

## Docker-based stack options

From `services/`:

- Build and run full stack locally:

```bash
docker compose up --build
```

- Run full stack using prebuilt cloud images:

```bash
docker compose -f docker-compose.dev.yaml up -d
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
| `http://127.0.0.1:3004` | Analytics service |
| `http://127.0.0.1:3004/stats` | Analytics stats endpoint |
| `http://127.0.0.1:15672` | RabbitMQ Management (guest/guest) |

## Public gateway API surface

### Auth routes

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `GET /auth/refresh`
- `GET /auth/users?page=&onPage=`

### Chat routes

- `POST /chat/join`
- `GET /chat/rooms`
- `POST /chat/members`
- `POST /chat/leave`

### Analytics routes

- `GET /analytics`
- `GET /analytics/activity?range=1m|1h|1d|7d|30d`
- `GET /analytics/message-times?range=1m|1h|1d|7d|30d`
- `GET /analytics/activity/messages?range=1m|1h|1d|7d|30d`

### Health route

- `GET /health`

## Development commands

### Backend services (identity/chat/analytics/gateway)

- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

Identity utility:

- `npm run seed`

### Client

- `pnpm dev`
- `pnpm build`
- `pnpm lint`

## Testing notes

- Backend e2e tests use `services/docker-compose.test.yaml`.
- Analytics currently has no unit tests configured, so `npm run test` may exit non-zero when no tests are discovered.

## Additional documentation

- Platform architecture: `docs/architecture.md`
- Identity service: `services/identity/README.md`
- Chat service: `services/chat/README.md`
- Analytics service: `services/analytics/README.md`

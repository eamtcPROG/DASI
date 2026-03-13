# AGENTS.md

## Cursor Cloud specific instructions

### Overview

DASI is a multi-service platform with four services under `services/`:

| Service | Framework | Port | Package Manager |
|---------|-----------|------|-----------------|
| `services/identity` | NestJS 11 | 3001 | npm |
| `services/analytics` | NestJS 11 | 3002 | npm |
| `services/gateway` | NestJS 11 | 3000 | npm |
| `services/client` | Next.js 16 | 3000 (default) | pnpm |

### Infrastructure

PostgreSQL and RabbitMQ are required. Start them from `services/` with:

```bash
docker compose -f docker-compose.dev.yaml up -d
```

This starts `postgres-identity` (port 5432), `postgres-analytics` (port 5433), and `rabbitmq` (port 5672). Docker daemon must be running first (`sudo dockerd &>/tmp/dockerd.log &`).

### Port conflict

The gateway (port 3000) and the Next.js client (default port 3000) collide. Run the client on a different port: `npx next dev --port 3100`.

### Running services

Each backend service: `npm run start:dev` from its directory. The client: `pnpm dev` (or `npx next dev --port 3100`).

### Lint / Test / Build

See each service's `package.json` `scripts` section. Standard commands:

- **Lint**: `npm run lint` (backends), `pnpm lint` (client)
- **Unit tests**: `npm run test` (backends). Analytics has no unit tests yet (exits code 1 with `--passWithNoTests` not set).
- **E2E tests**: `npm run test:e2e` (requires test DB stack via `docker compose -f docker-compose.test.yaml up -d`)
- **Build**: `npm run build` (backends), `pnpm build` (client)

### Gateway routes

The gateway proxies identity via `/auth/*` and analytics via `/analytics/*` (not `/user/*`). Auth routes: `POST /auth/sign-up`, `POST /auth/sign-in`, `GET /auth/refresh`, `GET /auth/users`.

### Seed data

The identity service has a seed script: `npm run seed` (from `services/identity`). Creates `admin@example.com` / `password123` and `dev@example.com` / `password123`.

### Environment files

Pre-committed `.env` files exist in each backend service's `env/` directory. No secrets need to be configured for local development.

# DASI architecture

This document describes the current architecture implemented in the repository. It focuses on the actual runtime boundaries, communication patterns, local development topology, and the responsibilities of each service.

## System context

```mermaid
flowchart LR
    Browser[Browser]
    Client[Next.js client]
    Gateway[NestJS gateway]
    Identity[NestJS identity service]
    Analytics[NestJS analytics service]
    RabbitMQ[(RabbitMQ)]
    IdentityDB[(PostgreSQL identity)]
    AnalyticsDB[(PostgreSQL analytics)]

    Browser --> Client
    Client -->|HTTP| Gateway
    Gateway -->|RMQ RPC| RabbitMQ
    RabbitMQ --> Identity
    RabbitMQ --> Analytics
    Identity --> IdentityDB
    Analytics --> AnalyticsDB
```

## Service responsibilities

| Service | Responsibility | Main protocols | Persistence |
| --- | --- | --- | --- |
| `client` | Renders UI, hosts auth forms, protects pages, manages session cookies, calls the gateway from server-side helpers and route handlers | HTTP | None |
| `gateway` | Public API entry point, JWT validation, request shaping, RabbitMQ proxying, health reporting | HTTP, RabbitMQ | None |
| `identity` | User registration, sign-in, token refresh, token validation, user listing | HTTP, RabbitMQ | PostgreSQL |
| `analytics` | Analytics endpoints and RabbitMQ handlers for message, user, and general analytics | HTTP, RabbitMQ | PostgreSQL wiring present |

## Repository topology

```text
services/
├── client/      # Next.js frontend
├── gateway/     # NestJS gateway and public API
├── identity/    # NestJS auth and user service
├── analytics/   # NestJS analytics service
├── docker-compose.dev.yaml
├── docker-compose.test.yaml
└── docker-compose.yaml
```

## Runtime architecture

### Client

- The client is a Next.js 16 application.
- Public routes live under `app/(public)`.
- Protected routes live under `app/(protected)`.
- Auth route handlers under `app/api/auth/*` forward requests to the gateway.
- Session refresh is handled server-side through the gateway using the auth cookie.

Practical implication: browser code does not need to talk directly to identity or analytics. The client talks to the gateway, and the gateway owns backend orchestration.

### Gateway

The gateway is the backend front door. It provides:

- `/auth/*` routes for sign-up, sign-in, refresh, and user listing
- `/analytics/*` routes for analytics retrieval
- `/health` for service health
- `/api` Swagger documentation

It also applies a global JWT guard and uses RabbitMQ clients to communicate with:

- the identity queue: `user`
- the analytics queue: `analytics`

### Identity

The identity service is responsible for:

- creating users
- authenticating users
- issuing and refreshing JWTs
- validating tokens for the gateway
- listing users

It exposes:

- direct HTTP routes under `/user/*`
- Swagger at `/api`
- a RabbitMQ microservice queue named `user`

Identity owns its own PostgreSQL database.

### Analytics

The analytics service exposes:

- direct HTTP routes under `/analytics/*`
- Swagger at `/api`
- a RabbitMQ microservice queue named `analytics`

The service is wired to its own PostgreSQL database, but the current implementation returns placeholder values for analytics responses.

## Request flows

### Sign-in flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as Next.js client
    participant G as Gateway
    participant R as RabbitMQ
    participant I as Identity
    participant D as Identity DB

    B->>C: Submit sign-in form
    C->>G: POST /auth/sign-in
    G->>R: send(sign_in)
    R->>I: sign_in
    I->>D: Validate user credentials
    D-->>I: User record
    I-->>R: Auth payload
    R-->>G: Auth payload
    G-->>C: HTTP response
    C-->>B: Session cookie set
```

### Authenticated page load

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as Next.js client
    participant G as Gateway
    participant R as RabbitMQ
    participant I as Identity

    B->>C: Request protected page
    C->>G: GET /auth/refresh with bearer token
    G->>R: send(refresh_token)
    R->>I: refresh_token
    I-->>R: User + token payload
    R-->>G: User + token payload
    G-->>C: Refreshed session
    C-->>B: Render protected page
```

### Analytics flow

```mermaid
sequenceDiagram
    participant C as Next.js client or API consumer
    participant G as Gateway
    participant R as RabbitMQ
    participant A as Analytics

    C->>G: GET /analytics/general
    G->>R: send(get_analytics, type=general)
    R->>A: get_analytics
    A-->>R: Analytics response
    R-->>G: Analytics response
    G-->>C: HTTP response
```

## HTTP API boundaries

### Public gateway routes

| Route | Purpose | Auth |
| --- | --- | --- |
| `POST /auth/sign-up` | Register a user | Public |
| `POST /auth/sign-in` | Sign in a user | Public |
| `GET /auth/refresh` | Refresh the session token | Bearer token |
| `GET /auth/users` | List users | Bearer token |
| `GET /analytics/messages` | Message analytics | Bearer token |
| `GET /analytics/users` | User analytics | Bearer token |
| `GET /analytics/general` | General analytics | Bearer token |
| `GET /health` | Gateway health and realtime status | Public |

### Direct service routes

| Service | Route prefix | Notes |
| --- | --- | --- |
| Identity | `/user/*` | Internal or standalone use; not the same public shape as the gateway |
| Analytics | `/analytics/*` | Same route family as the gateway, but without gateway auth enforcement |

Important distinction: the client and other consumers should use the gateway's `/auth/*` routes rather than the identity service's `/user/*` routes unless they are intentionally bypassing the gateway.

## Messaging architecture

RabbitMQ is used for request-response communication between the gateway and domain services.

| Producer | Queue | Consumer | Patterns |
| --- | --- | --- | --- |
| Gateway | `user` | Identity | `sign_up`, `sign_in`, `refresh_token`, `list_users`, `validate_token` |
| Gateway | `analytics` | Analytics | `get_analytics` |

This means the gateway is not calling identity or analytics over HTTP for its primary runtime path.

## Data architecture

Each domain service owns its own PostgreSQL database:

| Database | Local port | Owner |
| --- | --- | --- |
| `identity` | `5432` | Identity service |
| `analytics` | `5433` | Analytics service |

This separation keeps service data boundaries explicit and matches the development and production compose files.

## Environments and deployment topology

### Development infrastructure

`services/docker-compose.dev.yaml` starts only the shared infrastructure:

- `postgres-identity`
- `postgres-analytics`
- `rabbitmq`

Application services are started manually from their own directories in development.

### Containerized stack

`services/docker-compose.yaml` starts:

- `gateway`
- `identity`
- `analytics`
- `postgres-identity`
- `postgres-analytics`
- `rabbitmq`

The Next.js client is not part of that compose file and is expected to run separately.

### Test stack

`services/docker-compose.test.yaml` provisions isolated infrastructure for backend e2e tests.

## Local development ports

| Component | Port |
| --- | --- |
| Gateway | `3000` |
| Identity | `3001` |
| Analytics | `3002` |
| Client | `3100` recommended in dev |
| RabbitMQ | `5672` |
| Postgres identity | `5432` |
| Postgres analytics | `5433` |

The client defaults to port `3000`, which conflicts with the gateway. For local development, run the client with `npx next dev --port 3100`.

## Operational notes

- All backend services load environment variables from `env/.env.${NODE_ENV}`.
- Swagger is available on `/api` for the gateway, identity, and analytics services.
- The gateway health response includes realtime metadata.
- Redis configuration exists in the gateway, but realtime currently reports `enabled: false`.
- Analytics endpoints currently return placeholder values, so the architecture is in place even though the analytics domain logic is not complete yet.

## Recommended integration path

When building on top of DASI:

1. Use the Next.js client for browser-facing UX.
2. Integrate backend consumers through the gateway first.
3. Treat identity and analytics direct HTTP APIs as internal or service-level interfaces.
4. Use the service-specific READMEs for domain-level details.

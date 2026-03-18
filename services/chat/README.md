# Analytics Service

NestJS service responsible for providing analytics about messages, users, and other platform metrics. Other services can interact with it via **HTTP REST API** or **RabbitMQ message patterns**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Running the Service](#running-the-service)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [HTTP API](#http-api)
- [Message-Based API (RabbitMQ)](#message-based-api-rabbitmq)
- [Response Format](#response-format)
- [Swagger Documentation](#swagger-documentation)
- [Integration Guide for Other Services](#integration-guide-for-other-services)
- [Tests](#tests)

---

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (for analytics data)
- **RabbitMQ** (for event-driven analytics requests)

When running via Docker Compose from `services/`, PostgreSQL and RabbitMQ are started automatically.

---

## Running the Service

### Local development

1. From the **analytics** directory:
   ```bash
   cd services/analytics
   npm install
   ```

2. Ensure PostgreSQL and RabbitMQ are running (e.g. via `services/docker-compose.yaml`):
   ```bash
   cd services
   docker compose up -d postgres-analytics rabbitmq
   ```

3. Copy or create env file and start the app:
   ```bash
   # env is loaded from env/.env.development
   npm run start:dev
   ```

   Default HTTP port: **3002**.

### With Docker Compose (full stack)

From the **services** directory:

```bash
docker compose up -d
```

Analytics service will be at `http://localhost:3002`.

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in development with watch (uses `env/.env.development`) |
| `npm run start:prod` | Run production build (`node dist/main`) |
| `npm run build` | Build the NestJS app to `dist/` |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (requires DB and `env/.env.test`) |

---

## Environment Variables

Create `env/.env.development` (or `.env.production`, `.env.test`) with:

```env
NODE_ENV=development
PORT=3002
VERSION=1.0.0

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=analytics

# RabbitMQ
RABBITMQ_URI=amqp://guest:guest@localhost:5672
```

---

## HTTP API

### Base URL

- Development: `http://localhost:3002`
- Production: Configured via environment

### Endpoints

#### GET `/analytics/messages`

Get analytics about messages.

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    "totalMessages": 0,
    "messagesPerDay": 0,
    "averageMessageLength": 0
  },
  "messages": []
}
```

#### GET `/analytics/users`

Get analytics about users.

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    "totalUsers": 0,
    "activeUsers": 0,
    "newUsersThisMonth": 0
  },
  "messages": []
}
```

#### GET `/analytics/general`

Get general platform analytics.

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    "totalMessages": 0,
    "totalUsers": 0,
    "platformUptime": 0
  },
  "messages": []
}
```

---

## Message-Based API (RabbitMQ)

The analytics service connects to RabbitMQ and consumes from the **`analytics`** queue. Other services can request analytics by sending messages and reading the reply.

### Pattern: `get_analytics`

**Request payload:**

```json
{
  "type": "messages" | "users" | "general"
}
```

**Response:**

```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    // Analytics data based on type
  },
  "messages": []
}
```

---

## Response Format

### Single object (e.g. analytics endpoints)

```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    // Analytics data
  },
  "messages": []
}
```

### Error responses

On validation or errors, the same wrapper is used with `error: true`, appropriate `htmlcode` (e.g. 400, 500), and often `object: null` with `messages` describing the issue.

---

## Swagger Documentation

Once the service is running, visit:

- `http://localhost:3002/api` (development)

This provides interactive API documentation with request/response schemas.

---

## Integration Guide for Other Services

### HTTP Integration

```typescript
// Example: Fetch message analytics
const response = await fetch('http://localhost:3002/analytics/messages');
const data = await response.json();
```

### RabbitMQ Integration

```typescript
// Example: Request analytics via RabbitMQ
// Send message to 'analytics' queue with pattern 'get_analytics'
// Receive response with analytics data
```

---

## Tests

```bash
# Unit tests
npm run test

# E2E tests (requires running DB)
npm run test:e2e
```

---

## Future Enhancements

This service is currently a placeholder with basic structure. Future implementations will include:

- Real-time analytics collection
- Message analytics (counts, trends, patterns)
- User analytics (activity, engagement, growth)
- Platform metrics (uptime, performance, usage)
- Historical data aggregation
- Custom analytics queries
- Data visualization endpoints


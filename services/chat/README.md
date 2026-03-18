# Chat Service

NestJS service responsible for real-time chat functionality, including room management, message handling, and WebSocket connections. Other services can interact with it via **HTTP REST API** or **RabbitMQ message patterns**.

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
- **PostgreSQL** (for chat data)
- **RabbitMQ** (for real-time messaging)

When running via Docker Compose from `services/`, PostgreSQL and RabbitMQ are started automatically.

---

## Running the Service

### Local development

1. From the **chat** directory:
   ```bash
   cd services/chat
   npm install
   ```

2. Ensure PostgreSQL and RabbitMQ are running (e.g. via `services/docker-compose.yaml`):
   ```bash
   cd services
   docker compose up -d postgres-chat rabbitmq
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

Chat service will be at `http://localhost:3001`.

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
PORT=3001
VERSION=1.0.0

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=chat

# RabbitMQ
RABBITMQ_URI=amqp://guest:guest@localhost:5672
```

---

## HTTP API

### Base URL
- Development: `http://localhost:3001`
- Production: Configured via environment

### Endpoints

#### GET `/chat/rooms`
Get all rooms where the authenticated user is a member (not banned).

**Request:**
```json
{
  "userId": 123
}
```

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": [
    {
      "id": 1,
      "name": "General Chat",
      "description": "General discussion room"
    }
  ]
}
```

#### GET `/chat/messages`
Get message history for a specific room.

**Request:**
```json
{
  "type": "messages",
  "payload": {
    "roomId": 1
  }
}
```

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": [
    {
      "id": 1,
      "content": "Hello world!",
      "user_id": 123,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### GET `/chat/members`
Get members of a specific room.

**Request:**
```json
{
  "type": "members",
  "payload": {
    "roomId": 1
  }
}
```

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": [
    {
      "userId": 123,
      "role": 2,
      "joinedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### POST `/chat/leave`
Leave a specific room.

**Request:**
```json
{
  "type": "leave",
  "payload": {
    "userId": 123,
    "roomId": 1
  }
}
```

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": null
}
```

---

## Message-Based API (RabbitMQ)

The chat service connects to RabbitMQ and consumes from the **`chat`** queue. Other services can request chat operations by sending messages and reading the reply.

### Pattern: `get_chat`

**Request payload:**
```json
{
  "type": "messages" | "users" | "general" | "rooms" | "leave" | "members",
  "payload": {
    // Data based on type
  }
}
```

**Response:**
```json
{
  "error": false,
  "htmlcode": 200,
  "object": {
    // Chat data based on type
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
// Example: Fetch chat rooms
const response = await fetch('http://localhost:3001/chat/rooms');
const data = await response.json();
```

### RabbitMQ Integration

```typescript
// Example: Send chat event via RabbitMQ
// Send message to 'chat' queue with pattern 'chat_event'
// Receive response with chat data
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

This service is currently functional with core chat features. Future implementations will include:

- **Message reactions** - Emoji reactions to messages
- **File sharing** - Share files in chat rooms
- **Message threading** - Nested replies with better UI
- **Typing indicators** - Real-time typing status
- **Message search** - Search within room history
- **User presence** - Online/away status for users
- **Push notifications** - Mobile push notifications
- **Message encryption** - End-to-end encryption
- **Rate limiting** - Prevent spam and abuse
- **Analytics** - Chat usage metrics and insights
- **Performance optimization** - Caching and connection pooling


# DASI project presentation

## Project summary

DASI is a modern multi-service collaboration platform built around authentication, realtime chat, analytics, and operational scalability.

The project is designed to separate user experience concerns from domain logic and infrastructure concerns. The frontend focuses on usability and fast interaction, while backend services are split by responsibility so each domain can evolve independently.

At its current stage, the platform delivers:

- user registration and authentication
- protected application access
- chat room creation and member management
- realtime messaging and room activity
- analytics dashboards for platform usage
- email-based password reset

## Vision

The platform aims to provide a clean and extensible foundation for communication-centric products.

The architectural direction emphasizes:

- clear service boundaries
- isolated data ownership
- asynchronous workflows where they add resilience
- a single public API boundary for clients
- support for both realtime interaction and analytical insight

This makes the system suitable for products that need to mix transactional user actions with event-driven reporting and background processing.

## Business value

DASI creates value in several ways:

### 1. Better user experience

- Users interact with a single web application instead of multiple disconnected tools.
- Authentication, chat, analytics, and recovery flows are presented in one coherent product.
- Realtime messaging makes collaboration immediate and interactive.

### 2. Stronger maintainability

- Each backend service has a focused responsibility.
- Teams can work on identity, chat, analytics, or notifications without tightly coupling changes.
- Service-specific storage reduces accidental cross-domain coupling.

### 3. Easier scalability

- High-traffic workflows can be scaled independently.
- RabbitMQ decouples domain events and background processing from synchronous user requests.
- Notification delivery can grow separately from the identity service.

### 4. Better observability of product usage

- Analytics captures user creation, room creation, and message activity.
- Dashboard endpoints make platform activity visible to the product itself.
- Activity data supports future reporting, monitoring, and decision-making.

## Product capabilities

### Authentication and user management

The identity domain manages:

- account creation
- sign-in
- token refresh
- token validation
- user listing and lookup
- password reset by email code

This gives the platform a secure access model and a base for future role-aware features.

### Realtime collaboration

The chat domain manages:

- room creation
- room membership
- room history
- sending, editing, and deleting messages
- realtime room participation

This allows the system to support team-style collaboration and live communication scenarios.

### Analytics

The analytics domain tracks:

- total users
- total chats
- total messages
- activity over time
- message timing series for dashboards

This turns platform activity into measurable insight instead of leaving usage hidden inside transactional tables.

### Notifications

The notification domain currently focuses on email delivery.

Its first major use case is password reset, but the same architecture can support:

- invitation emails
- security alerts
- onboarding messages
- digest-style notifications

## Technical architecture at a glance

The platform is composed of six application services:

| Service | Role |
| --- | --- |
| `client` | Next.js web application used by end users |
| `gateway` | Public API and realtime entry point |
| `identity` | Authentication and user management service |
| `chat` | Chat room and messaging service |
| `analytics` | Activity and reporting service |
| `notification` | Email delivery worker |

Shared infrastructure includes:

- RabbitMQ for messaging
- Redis for gateway realtime/runtime support
- PostgreSQL for identity data
- PostgreSQL for chat data
- MongoDB for analytics data

## How the system works

### Client-first access model

Users access the platform through the Next.js client. The client does not directly orchestrate the whole backend. Instead, it uses the gateway as the main entry point for application operations.

This gives the platform:

- a single public backend boundary
- centralized security enforcement
- simpler frontend integration
- cleaner service-to-service coordination

### Gateway as the orchestration layer

The gateway is one of the most important parts of the system.

It is responsible for:

- receiving public HTTP requests
- enforcing authentication rules
- forwarding commands to domain services
- serving as the primary Socket.IO endpoint
- coordinating analytics events
- exposing health and integration status

This means the gateway is not the owner of domain data, but it is the traffic controller for the platform.

### Domain ownership

Each backend domain owns its own data and logic:

- identity owns users and password reset codes
- chat owns rooms, memberships, and messages
- analytics owns snapshots and event history
- notification owns outbound email execution

This ownership model is important because it prevents one service from becoming a monolith with too many reasons to change.

## Main user flows

### User registration

1. A user signs up through the client.
2. The gateway forwards the request to identity.
3. Identity creates the user and returns an access token.
4. Identity emits an analytics event so the analytics service updates platform counters.

### User sign-in

1. A user submits credentials through the client.
2. The gateway forwards the request to identity through RabbitMQ.
3. Identity validates credentials and returns a token.
4. The client uses the authenticated session for protected areas.

### Password reset

1. A user requests a reset code.
2. The gateway forwards the request to identity.
3. Identity creates a short-lived reset code and sends an email request to notification.
4. Notification delivers or previews the email.
5. The user submits the code and a new password.
6. Identity validates the code and updates the password.

### Chat room collaboration

1. An authenticated user creates a room and selects members.
2. The gateway forwards the command to chat.
3. Chat persists the room and membership.
4. The gateway emits an analytics event for room creation.
5. Realtime updates notify relevant users.

### Realtime messaging

1. The browser opens a Socket.IO connection to the gateway.
2. The gateway validates the token with identity.
3. The user joins a room.
4. Messages are persisted by the chat service.
5. The gateway broadcasts realtime updates to the room.
6. The gateway also emits analytics events for message activity.

### Analytics dashboard

1. The client requests dashboard data through the gateway.
2. The gateway reads totals and activity from analytics.
3. For some message-based views, the gateway also composes data from chat timestamps.
4. The client renders a view of current system usage and activity trends.

## Why this architecture is important

This project is more than a set of endpoints. It demonstrates a clear architectural style.

### Separation of concerns

Each service has a limited and well-defined purpose. That improves:

- readability
- testability
- deployment flexibility
- long-term maintainability

### Mix of synchronous and asynchronous communication

The system uses the right communication style for each problem:

- HTTP for public request/response workflows
- Socket.IO for interactive realtime behavior
- RabbitMQ for service commands and domain events

This makes the platform both responsive and resilient.

### Scalable foundation

Because the platform is split by responsibility, growth can happen in targeted ways:

- more gateway instances for public traffic
- more notification workers for email load
- more analytics capacity for event-heavy reporting
- more chat capacity for message throughput

## Deployment model

The repository supports multiple runtime styles:

- local development with app services started from source
- Docker-based full stack execution
- prebuilt image-based stack execution
- isolated test infrastructure for backend e2e flows

This makes the project suitable both for day-to-day development and for demonstration environments.

## Strengths of the current solution

- clean microservice separation
- clear public gateway boundary
- realtime and analytics support in the same platform
- email workflow isolated from identity
- dedicated persistence per business domain
- flexible local and container-based runtime options

## Natural future evolution

The current system provides a strong base for future features such as:

- roles and permissions
- richer collaboration workflows
- invitations and onboarding automation
- notification templates and delivery channels
- advanced analytics and reporting
- multi-instance realtime scaling patterns

## Conclusion

DASI is a solid example of a modern distributed web platform.

It combines:

- a polished frontend delivery model
- a gateway-centered API design
- focused backend domain services
- asynchronous event-driven processing
- realtime communication
- analytics visibility

The result is a project that is both practical today and structurally prepared for future growth.

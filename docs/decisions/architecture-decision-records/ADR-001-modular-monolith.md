# ADR-001: Adoption of Modular Monolith Architecture over Microservices

- **Status**: **ACCEPTED**
- **Deciders**: Software Architecture Team, Senior Backend Engineer, Product Strategist
- **Date**: 2026-11-20
- **Technical Story**: Phase 2 System Architecture & Foundation Design
- **Source Specification**: `app.txt` Section 6 (Lines 542–546, 577–684); `PROJECT.md` Section 1

---

## 1. Context and Problem Statement

The Egyptian Student Housing Platform connects Egyptian university students with verified accommodation providers. The platform requires high developer velocity, absolute data consistency across booking states and room availability, shared type safety across frontend and backend, and low operational overhead during the startup phase.

We evaluated architectural paradigms to structure the codebase, balancing scalability, delivery speed, operational complexity, and data consistency.

---

## 2. Decision Drivers

1. **Transactional Integrity & Concurrency**: Mutual agreement confirmation requires atomic state transitions across multiple domains (BookingRequest, AgreementConfirmation, Availability, Conversation, Notifications). Distributed transactions across microservices introduce significant failure modes.
2. **Startup Stage & Team Topology**: As an early-stage startup progressing from discovery to MVP, operational complexity must be minimized. Deploying, monitoring, and debugging a fleet of microservices adds substantial overhead without proportional business value.
3. **End-to-End TypeScript Type Safety**: Maintaining synchronization between frontend API clients (`apps/web`), backend API endpoints (`apps/api`), validation schemas, and domain models requires a unified workspace.
4. **Explicit Instruction in Project Specification**: `app.txt` explicitly dictates: _"Scalable modular monolith... Microservices are explicitly prohibited for MVP."_ (Section 6, Lines 542–546).

---

## 3. Considered Options

### Option 1: Microservices Architecture (Distributed Polyglot Services)

- Decoupled services (Auth Service, Listings Service, Booking Service, Messaging Service, Review Service).
- Independent databases per service.
- Communication via gRPC / HTTP REST and asynchronous message brokers (RabbitMQ / Kafka).

### Option 2: Polyglot Multi-Repository Architecture

- Separate git repositories for frontend and backend.
- Independent deployment cycles and package versions published to a private registry.

### Option 3: Monorepo Modular Monolith (Selected)

- Single repository (`student-housing-platform/`) managed via npm workspaces.
- Distinct application boundaries: `apps/web` (Next.js) and `apps/api` (NestJS).
- 24 well-bounded internal domain modules in NestJS.
- Shared packages: `packages/shared-types`, `packages/shared-config`, `packages/api-client`, `packages/validation`.
- Single PostgreSQL database with strict modular schema segregation.

---

## 4. Decision Outcome

**Chosen Option: Option 3 — Monorepo Modular Monolith.**

We structure the platform as a Modular Monolith in a monorepo. The backend application (`apps/api`) encapsulates all domain capabilities in 24 isolated modules. Cross-module communication occurs exclusively via injected TypeScript services and well-defined DTOs. Direct database queries across domain boundaries are strictly forbidden.

### Why Microservices Were Rejected for MVP:

1. **Distributed Data Consistency Failures**: When a student and owner confirm a booking agreement, the target bed/room must be atomically locked and marked `BOOKED`, competing booking requests auto-closed, an agreement confirmation persisted, and a conversation thread validated. In a microservices architecture, this requires a Saga orchestrator or 2-Phase Commit (2PC), which introduces eventual consistency race conditions, complex compensation transactions, and elevated latency.
2. **Operational Overhead**: Microservices require service discovery, distributed tracing, API gateways, independent CI/CD pipelines, container orchestration (Kubernetes), and multi-database monitoring. This operational burden drains resources away from core product discovery and user value delivery.
3. **Network Latency & Serialization Cost**: Inter-service HTTP/gRPC calls introduce serialization overhead and network hops compared to in-process function invocation in a modular monolith.
4. **Premature Boundary Hardening**: In early startup discovery, domain boundaries frequently evolve. Refactoring boundaries within a modular monolith is a straightforward code refactor; refactoring boundaries across microservices requires database schema migrations, API versioning, and coordinated deployments across multiple repositories.

---

## 5. Architectural Invariants & Constraints

1. **Strict Module Encapsulation**: Each NestJS module owns its entities, repositories, and services. A module must export only its public service interface.
2. **Zero Cross-Module Direct Database Queries**: Module A must never import Module B's repository or execute direct SQL queries against tables owned by Module B.
3. **Single Transactional Unit-of-Work**: Multi-module transactions (e.g., Agreement Confirmation) must use a centralized transactional runner with PostgreSQL row-level locks (`SELECT ... FOR UPDATE`).
4. **Shared Package Contracts**: Any data contract shared between `apps/web` and `apps/api` must reside in `packages/shared-types` or `packages/validation`.

---

## 6. Consequences & Trade-offs

### Positive Consequences

- **Rapid Feature Iteration**: Changes to data models or API signatures can be updated, type-checked, and tested across frontend and backend in a single atomic git commit.
- **ACID Transaction Simplicity**: All database updates execute within standard PostgreSQL transactions with zero distributed locking complexity.
- **Simplified Deployment & Monitoring**: Single backend container and single frontend container orchestrated via Docker Compose in development and straightforward container hosting in production.
- **Future Extensibility**: Because domain boundaries are strictly modularized, any high-traffic module (e.g., search indexing or real-time messaging) can be decoupled into an independent microservice later without rewriting business logic.

### Negative Consequences & Mitigation

- **Risk of Architectural Erosion**: Developers may be tempted to bypass service interfaces and couple modules.
  _Mitigation_: Enforce strict ESLint boundary rules and automated module dependency linting in CI/CD.
- **Single Process Blast Radius**: An unhandled exception or memory leak in one module can potentially crash the entire backend process.
  _Mitigation_: Implement global NestJS exception filters, process monitoring, container restarts, and isolated error boundaries.

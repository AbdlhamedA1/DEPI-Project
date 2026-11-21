# ADR-003: NestJS Modular Architecture with 24 Discrete Domain Modules

- **Status**: **ACCEPTED**
- **Deciders**: Backend Architecture Team, Senior Backend Engineer, Database Architect
- **Date**: 2026-11-20
- **Technical Story**: Phase 2 System Architecture & Backend API Scaffolding
- **Source Specification**: `app.txt` Section 6 (Lines 587–625); `app2.txt` (Lines 111–183)

---

## 1. Context and Problem Statement

The backend application (`apps/api`) powers all transactions, identity verification, property inventory hierarchies, pricing, availability states, real-time messaging, review qualification, administrative moderation, and audit logging.

We needed a backend framework and architectural pattern that:

1. Enforces strict modular boundaries across 26 conceptual domain entities.
2. Prevents tight coupling and circular dependencies.
3. Provides first-class TypeScript support with compile-time and runtime type safety.
4. Standardizes dependency injection, request lifecycle interceptors, and exception handling.

---

## 2. Decision Drivers

1. **Domain Complexity**: Managing 26 distinct entities (including hierarchical accommodations, availability states, and multi-currency/duration pricing) requires structured separation of concerns.
2. **Explicit Project Specification**: `app.txt` Section 6 and `app2.txt` explicitly list 24 discrete domain modules required in the backend.
3. **Robust Input Validation & Security**: Preventing invalid data, negative pricing, unauthorized access, and privilege escalation requires centralized validation pipes and role guards.
4. **Architectural Longevity**: Clean modular encapsulation ensures that any high-throughput domain (e.g., messaging or search) can be extracted into an independent microservice in the future if required.

---

## 3. Considered Options

### Option 1: Express.js with Custom Folder Layering

- Standard Node.js framework with manual routing and controller folders.
- **Drawbacks**: Lacks standardized dependency injection; no built-in module encapsulation; highly prone to architecture erosion, duplicate code, and ad-hoc database queries across features.

### Option 2: Fastify Standalone with Plugins

- High-performance web framework.
- **Drawbacks**: Plugin model can be fragmented for complex enterprise domain logic; lacks structured object-oriented dependency injection patterns.

### Option 3: NestJS Modular Monolith Architecture (Selected)

- Enterprise-grade TypeScript framework built on top of Express/Fastify.
- Enforces modular architecture with `@Module()`, `@Injectable()`, `@Controller()`.
- Built-in Dependency Injection container.
- Declarative validation pipes using DTOs, Zod, and `class-validator`.

---

## 4. Decision Outcome

**Chosen Option: Option 3 — NestJS Modular Architecture with 24 Discrete Domain Modules.**

We implement `apps/api` using NestJS, organized into 24 isolated modules strictly mirroring the domain specifications in `app.txt` and `app2.txt`:

1. `auth`: OTP generation, verification, JWT session tokens, refresh tokens.
2. `users`: Base user entity, password hashing, account status.
3. `students`: Student profile, university affiliation, enrollment documents.
4. `owners`: Property provider profiles (owner, agent, company), business info, tax IDs.
5. `universities`: Pre-seeded Egyptian universities and main campus geocoordinates.
6. `locations`: Egyptian governorates, cities, areas, and boundary data.
7. `properties`: Property buildings, geographic coordinates, general amenities.
8. `units`: Individual apartment units within buildings, floors, bathroom counts.
9. `rooms`: Private and shared rooms inside units, bed capacities.
10. `beds`: Individual bookable beds inside shared rooms.
11. `pricing`: Multi-tier pricing rates (per person/bed/room/unit) across durations.
12. `availability`: State machine tracking availability (`AVAILABLE`, `BOOKED`, `MAINTENANCE`).
13. `search`: Proximity search engine and multi-filter discovery.
14. `booking-requests`: Request lifecycle, 3-open-request guardrail, owner accept/reject.
15. `agreements`: Mutual agreement confirmation, atomic row-locking, contract document attachments.
16. `messaging`: 1:1 request-linked conversation threads and messages.
17. `notifications`: In-app notification center and unread badge counters.
18. `reviews`: Post-confirmation verified reviews (1–5 stars) and single provider responses.
19. `reports`: Text-only violation reports and progressive resolution workflows.
20. `verification`: Property provider KYC inspection and approval queues.
21. `support`: Platform user assistance and ticketing.
22. `admin`: Administrator user management, property moderation, and configuration.
23. `analytics`: Marketplace supply/demand metrics and conversion analytics.
24. `platform-settings`: Dynamic runtime system parameters.

---

## 5. Architectural Invariants & Rules of Engagement

1. **Service-to-Service Boundary Discipline**: Cross-module interactions must occur strictly through public exported service methods injected via NestJS DI. Direct imports of another module's repository or entity models for mutation are strictly barred.
2. **Data Transfer Objects (DTOs)**: Every API endpoint must have dedicated request and response DTOs with validation decorators.
3. **Single Transactional Boundaries**: Operations modifying state across multiple modules (e.g., booking agreement confirmation updating Availability, Requests, and Messaging) must execute within a unified transaction coordinator using PostgreSQL row locks.
4. **Global Filters & Guards**:
   - `HttpExceptionFilter`: Standardizes all API error responses to `{ success: false, statusCode, error, message, timestamp }`.
   - `JwtAuthGuard` & `RolesGuard`: Enforces role-based access control (`STUDENT`, `OWNER`, `ADMIN`) across all protected controllers.

---

## 6. Consequences & Trade-offs

### Positive Consequences

- **High Consistency & Predictability**: New developers can navigate any of the 24 modules and find an identical structure (`.controller.ts`, `.service.ts`, `.module.ts`, `dto/`, `entities/`).
- **Comprehensive Testability**: Every service can be tested in complete isolation using Jest unit mocks.
- **Robust Security**: Centralized guards and pipes eliminate parameter injection and unauthorized state modification.

### Negative Consequences & Mitigation

- **Boilerplate Overhead**: NestJS requires modules, controllers, services, and DTO files for each domain entity.
  _Mitigation_: The monorepo foundation includes standardized generators and abstract base services to minimize repetitive code.

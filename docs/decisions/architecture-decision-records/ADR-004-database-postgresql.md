# ADR-004: PostgreSQL for Relational Integrity, Row-Level Locking, and Strict Migrations

- **Status**: **ACCEPTED**
- **Deciders**: Database Architect, Lead Backend Engineer, Security Engineer
- **Date**: 2026-11-20
- **Technical Story**: Phase 2 System Architecture & Phase 3 Technical Design
- **Source Specification**: `app.txt` Section 6 (Lines 547, 685–756), Section 15 (Line 1329); `PROJECT.md` Section 1

---

## 1. Context and Problem Statement

The Egyptian Student Housing Platform requires a persistence engine capable of modeling:

1. **Hierarchical Inventory**: 4-tier tree: `Property` (Building) → `PropertyUnit` (Apartment) → `Room` → `Bed`.
2. **High-Concurrency Booking Scenarios**: Preventing double bookings when multiple students simultaneously confirm agreements for the same unit or bed.
3. **Complex Relational Constraints**: Enforcing the 3-open-requests rule, single confirmed booking invariant, post-confirmation review qualification, and administrative audit trails.
4. **Strict Schema Evolution**: Deterministic database migrations across development, staging, and production environments.

We evaluated database paradigms and engines to satisfy these transactional and relational guarantees.

---

## 2. Decision Drivers

1. **ACID Transactions & Row-Level Locking**: Mutual confirmation of a rental agreement requires atomic, isolated execution. If two students click "Confirm" on the final bed in a shared room simultaneously, one must succeed and the other must cleanly abort with a concurrency conflict.
2. **Foreign Key Integrity**: Preventing dangling profiles, orphaned listings, or unverified documents when users or properties are updated.
3. **Geospatial Proximity Calculations**: Efficient storage of latitude/longitude coordinates and distance calculation from properties to university main campuses.
4. **Strict Migration Mandate**: `app.txt` Section 15 (Line 1329) explicitly states: _"Use database migrations rather than undocumented schema modifications."_

---

## 3. Considered Options

### Option 1: NoSQL Document Database (MongoDB)

- Flexible schema with document-level embedding.
- **Drawbacks**: Lacks strict relational foreign key constraints; multi-document ACID transactions introduce high latency overhead; complex aggregations for hierarchical partial availability calculations; risk of orphaned references.

### Option 2: MySQL / MariaDB Relational Database

- Mature relational database.
- **Drawbacks**: Weaker support for advanced JSON operations; less expressive indexing options for polymorphic relations; spatial features are less comprehensive than PostgreSQL/PostGIS.

### Option 3: PostgreSQL 16+ Relational Database (Selected)

- Enterprise-grade, open-source object-relational database.
- Robust ACID transaction isolation and explicit row-level locking (`SELECT ... FOR UPDATE`).
- Native JSONB support for itemized expenses and dynamic administrative action diffs.
- PostGIS / Earthdistance extensions for precise geospatial distance queries.
- Mature migration ecosystems (TypeORM / Prisma / Kysely).

---

## 4. Decision Outcome

**Chosen Option: Option 3 — PostgreSQL 16+ with Strict Schema Migrations and Explicit Row Locking.**

We select PostgreSQL 16+ as the single primary transactional database. The schema implements all 26 domain entities defined in `app.txt` Section 8, utilizing foreign keys with explicit `ON DELETE RESTRICT` or `CASCADE` rules.

### Core Concurrency Implementation:

To eliminate race conditions during booking agreements, the confirmation transaction executes an explicit row lock:

```sql
BEGIN;

-- Lock target bookable entity row to prevent concurrent modification
SELECT id, status
FROM availability
WHERE entity_type = $1 AND entity_id = $2
FOR UPDATE;

-- Verify target entity is still available
-- If status != 'AVAILABLE', ROLLBACK and return 409 Conflict

-- 1. Update Availability status
UPDATE availability
SET status = 'BOOKED', updated_at = NOW()
WHERE entity_type = $1 AND entity_id = $2;

-- 2. Confirm Agreement
UPDATE agreement_confirmations
SET status = 'CONFIRMED', student_confirmed_at = NOW()
WHERE id = $3;

-- 3. Update Booking Request status
UPDATE booking_requests
SET status = 'CONFIRMED'
WHERE id = $4;

-- 4. Auto-close competing pending requests for this specific entity
UPDATE booking_requests
SET status = 'CLOSED_CONFLICT', updated_at = NOW()
WHERE target_entity_type = $1
  AND target_entity_id = $2
  AND id != $4
  AND status IN ('PENDING', 'ACCEPTED');

COMMIT;
```

### Migration Management:

1. All schema modifications must be committed as numbered, idempotent SQL migration files under `apps/api/src/database/migrations/`.
2. Direct schema altering commands (e.g., `ALTER TABLE` via GUI or ad-hoc scripts) on staging or production databases are strictly prohibited.
3. Automated CI/CD pipelines run migration verification checks on every pull request.

---

## 5. Architectural Invariants

1. **Relational Referentials**: Every child entity (e.g., `Bed`, `Room`, `PropertyUnit`) must have a valid foreign key referencing its parent entity.
2. **Atomic Invariant Checks**: Business constraints (such as the 3-open-requests limit) are verified inside database transactions using indexed queries before inserting new request records.
3. **Immutable Audit Trails**: The `admin_action_logs` table has no `UPDATE` or `DELETE` endpoints exposed; rows are insert-only to preserve administrative accountability.

---

## 6. Consequences & Trade-offs

### Positive Consequences

- **Zero Double-Bookings**: PostgreSQL row-level locks guarantee deterministic, conflict-free agreement confirmations even under high concurrent request spikes.
- **Rock-Solid Referential Integrity**: Impossible to create reviews without confirmed bookings or properties without valid location records.
- **Deterministic Deployment**: Migrations ensure every developer machine, staging container, and production database share an identical schema state.

### Negative Consequences & Mitigation

- **Connection Pool Exhaustion Risk**: Long-running transactions holding row locks can exhaust database connection pools.
  _Mitigation_: Keep transactions minimal and tightly scoped (under 50ms); use connection pooling (e.g., PgBouncer) in production; configure strict query timeouts (`statement_timeout = 5000`).

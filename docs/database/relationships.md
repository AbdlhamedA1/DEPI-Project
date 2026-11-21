# Database Relationships, Cascade Policies & Concurrency Architecture

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & Database Architecture
- **Document Path**: `docs/database/relationships.md`
- **Target Engine**: PostgreSQL 16+

---

## 1. Foreign Key & Cascade Policy Matrix

The platform database enforces strict referential integrity across all 26 entities. The table below specifies every foreign key relationship, its cascade triggers on `DELETE` and `UPDATE`, and the architectural justification governing the policy.

| Parent Table                 | Child Table                  | Foreign Key Column          | ON DELETE  | ON UPDATE | Architectural & Business Justification                                                                                        |
| ---------------------------- | ---------------------------- | --------------------------- | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `users`                      | `student_profiles`           | `user_id`                   | `CASCADE`  | `CASCADE` | A student profile cannot exist without its root user identity. Deletion of the user account must clean up profile data.       |
| `users`                      | `property_provider_profiles` | `user_id`                   | `CASCADE`  | `CASCADE` | A provider profile is a 1:1 identity extension of the user account. Deleting the user purges the provider profile.            |
| `users`                      | `notifications`              | `user_id`                   | `CASCADE`  | `CASCADE` | Notifications are private to the recipient. User account deletion cascades to all associated notifications.                   |
| `users`                      | `messages`                   | `sender_id`                 | `RESTRICT` | `CASCADE` | Chat history integrity must be preserved. A user cannot be deleted if their messages form part of an existing conversation.   |
| `users`                      | `admin_action_logs`          | `admin_id`                  | `RESTRICT` | `CASCADE` | Compliance & auditing invariant (`BR-ADM-002`). An administrator account with audit log entries can never be deleted.         |
| `users`                      | `property_verifications`     | `reviewed_by`               | `SET NULL` | `CASCADE` | If an admin user is deactivated or removed, the verification record remains intact with the reviewer foreign key set to null. |
| `users`                      | `reports`                    | `reporter_id`               | `RESTRICT` | `CASCADE` | Grievance audit trail must be maintained; a reporter user cannot be deleted while active dispute records exist.               |
| `users`                      | `reports`                    | `reported_user_id`          | `SET NULL` | `CASCADE` | If a reported user account is purged, the historical dispute report remains preserved for administrative statistics.          |
| `users`                      | `reports`                    | `resolved_by`               | `SET NULL` | `CASCADE` | Retains administrative dispute record even if the resolving administrator leaves the organization.                            |
| `cities`                     | `areas`                      | `city_id`                   | `CASCADE`  | `CASCADE` | Areas (Dokki, Maadi, etc.) have no independent geographic existence outside of their parent city.                             |
| `cities`                     | `universities`               | `city_id`                   | `RESTRICT` | `CASCADE` | Prevents accidental deletion of a city that contains registered universities.                                                 |
| `cities`                     | `properties`                 | `city_id`                   | `RESTRICT` | `CASCADE` | Prevents deletion of a city containing listed student housing assets.                                                         |
| `areas`                      | `universities`               | `area_id`                   | `SET NULL` | `CASCADE` | District assignment for universities is optional; removing an area unlinks the university's area reference.                   |
| `areas`                      | `properties`                 | `area_id`                   | `RESTRICT` | `CASCADE` | Cannot delete a neighborhood district containing active property listings.                                                    |
| `universities`               | `student_profiles`           | `university_id`             | `RESTRICT` | `CASCADE` | Academic invariant. Cannot delete a university that has enrolled students registered on the platform.                         |
| `universities`               | `properties`                 | `nearest_university_id`     | `SET NULL` | `CASCADE` | Proximity reference for listings is an advisory index; deleting a university unlinks the proximity reference.                 |
| `property_provider_profiles` | `properties`                 | `owner_id`                  | `CASCADE`  | `CASCADE` | Provider listings are owned by the provider; removing a provider profile cascades to their listings.                          |
| `property_provider_profiles` | `property_verifications`     | `provider_id`               | `CASCADE`  | `CASCADE` | KYC documents belong to the provider; provider deletion purges their private verification documents.                          |
| `properties`                 | `property_images`            | `property_id`               | `CASCADE`  | `CASCADE` | Listing photos are subordinate assets; listing deletion removes all image gallery metadata.                                   |
| `properties`                 | `property_verifications`     | `property_id`               | `CASCADE`  | `CASCADE` | Listing deed verifications are tied to the property; property deletion removes property-specific KYC records.                 |
| `properties`                 | `property_units`             | `property_id`               | `CASCADE`  | `CASCADE` | Apartment units are physical components of a building; deleting the property cascades to all units.                           |
| `properties`                 | `additional_expenses`        | `property_id`               | `CASCADE`  | `CASCADE` | Utility fee schedules belong to the property listing and cascade upon listing removal.                                        |
| `properties`                 | `booking_requests`           | `property_id`               | `RESTRICT` | `CASCADE` | Legal & financial invariant. Cannot delete a property that has associated booking requests or contracts.                      |
| `properties`                 | `reviews`                    | `property_id`               | `RESTRICT` | `CASCADE` | Review audit trail. Cannot delete a property that has verified student reviews.                                               |
| `property_units`             | `rooms`                      | `unit_id`                   | `CASCADE`  | `CASCADE` | Rooms are internal partitions of an apartment unit; unit deletion cascades to all contained rooms.                            |
| `rooms`                      | `beds`                       | `room_id`                   | `CASCADE`  | `CASCADE` | Beds are sleeping accommodations within a shared room; room deletion cascades to all contained beds.                          |
| `student_profiles`           | `booking_requests`           | `student_id`                | `RESTRICT` | `CASCADE` | Student tenant cannot be deleted while historical or active booking requests exist.                                           |
| `booking_requests`           | `agreement_confirmations`    | `booking_request_id`        | `RESTRICT` | `CASCADE` | A booking request cannot be deleted if a mutual agreement confirmation record exists.                                         |
| `booking_requests`           | `conversations`              | `booking_request_id`        | `RESTRICT` | `CASCADE` | Invariant `BR-MSG-001`. The 1:1 conversation thread must never be orphaned or deleted.                                        |
| `booking_requests`           | `reviews`                    | `booking_request_id`        | `RESTRICT` | `CASCADE` | Invariant `BR-REV-001`. Confirmed booking requests that qualify a review must remain permanent.                               |
| `agreement_confirmations`    | `agreement_documents`        | `agreement_confirmation_id` | `CASCADE`  | `CASCADE` | Scanned rental documents are attachments to the agreement; removing the agreement cleans up document records.                 |
| `conversations`              | `messages`                   | `conversation_id`           | `CASCADE`  | `CASCADE` | Messages belong to a conversation thread. Deleting a conversation cascades to all child messages.                             |
| `reviews`                    | `review_responses`           | `review_id`                 | `CASCADE`  | `CASCADE` | An owner rebuttal is a child of the parent review; deleting the review cascades to the response.                              |

---

## 2. Polymorphic Accommodation Hierarchy & Indexing

### 2.1 The Accommodation Hierarchy

In Egyptian student housing, rental arrangements vary across four distinct tiers:

1. **`PROPERTY`**: Entire standalone building or private villa.
2. **`UNIT`**: Self-contained apartment or flat (e.g., Flat 4B).
3. **`ROOM`**: Private or shared bedroom inside an apartment.
4. **`BED`**: Specific bed (e.g., Bed 2 in a 3-bed shared room).

Four core entities must interface with all four tiers without duplicating database schemas:

- `pricings`: Rent rates can be set per bed, per room, per unit, or for the whole building.
- `additional_expenses`: Utility fees may apply to the whole property or be metered per apartment unit.
- `availabilities`: Availability calendars and booking status must track at the exact bookable tier.
- `booking_requests`: A student requests to book a specific bed, a private room, or a whole unit.

```
       [ Property ] (Building / Villa)
            |
            +---> Pricings (polymorphic)
            +---> Additional Expenses (polymorphic)
            +---> Availabilities (polymorphic)
            +---> Booking Requests (polymorphic)
            |
      [ Property Unit ] (Apartment)
            |
            +---> Pricings / Availabilities / Booking Requests
            |
         [ Room ] (Private / Shared)
            |
            +---> Pricings / Availabilities / Booking Requests
            |
          [ Bed ] (Individual sleeping spot)
            |
            +---> Pricings / Availabilities / Booking Requests
```

### 2.2 Compound Index Strategy vs. Sparse Columns

Instead of creating sparse tables with four nullable foreign keys (`property_id`, `unit_id`, `room_id`, `bed_id`) which leads to null-heavy tables and complex check constraints (`CHECK (num_nonnulls(...) = 1)`), the platform standardizes on the **Compound Type-Discriminator Pattern**:

```sql
-- Pattern applied in pricings, availabilities, and booking_requests:
entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
entity_id UUID NOT NULL
```

#### Performance Indexing:

```sql
-- Compound unique index on availability tier
CREATE UNIQUE INDEX idx_availabilities_entity
ON availabilities (entity_type, entity_id);

-- Compound index on pricing tier with active flag
CREATE UNIQUE INDEX idx_pricings_entity
ON pricings (entity_type, entity_id, duration_unit)
WHERE is_active = true;

-- Target lookup index on booking requests
CREATE INDEX idx_booking_requests_target
ON booking_requests (target_entity_type, target_entity_id, status);
```

### 2.3 Application-Layer & Database Trigger Integrity

Because standard SQL foreign keys cannot dynamically point to multiple target tables, referential integrity is guaranteed through:

1. **NestJS Domain Services**: The repository validates entity existence prior to write operations:
   ```typescript
   async validateTargetExists(type: TargetEntityType, id: string): Promise<boolean> {
     switch (type) {
       case TargetEntityType.PROPERTY:
         return await this.propertyRepo.exists({ where: { id } });
       case TargetEntityType.UNIT:
         return await this.unitRepo.exists({ where: { id } });
       case TargetEntityType.ROOM:
         return await this.roomRepo.exists({ where: { id } });
       case TargetEntityType.BED:
         return await this.bedRepo.exists({ where: { id } });
       default:
         return false;
     }
   }
   ```
2. **PostgreSQL Validation Trigger Function**:
   ```sql
   CREATE OR REPLACE FUNCTION validate_polymorphic_accommodation_target()
   RETURNS TRIGGER AS $$
   DECLARE
       target_exists BOOLEAN := false;
   BEGIN
       IF NEW.entity_type = 'PROPERTY' THEN
           SELECT EXISTS(SELECT 1 FROM properties WHERE id = NEW.entity_id) INTO target_exists;
       ELSIF NEW.entity_type = 'UNIT' THEN
           SELECT EXISTS(SELECT 1 FROM property_units WHERE id = NEW.entity_id) INTO target_exists;
       ELSIF NEW.entity_type = 'ROOM' THEN
           SELECT EXISTS(SELECT 1 FROM rooms WHERE id = NEW.entity_id) INTO target_exists;
       ELSIF NEW.entity_type = 'BED' THEN
           SELECT EXISTS(SELECT 1 FROM beds WHERE id = NEW.entity_id) INTO target_exists;
       END IF;

       IF NOT target_exists THEN
           RAISE EXCEPTION 'Foreign key violation: entity_id % does not exist in % table', NEW.entity_id, NEW.entity_type;
       END IF;

       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

---

## 3. Concurrency Control & Row-Level Locking Architecture

### 3.1 The Double-Booking Race Condition Problem

In a student housing marketplace, multiple students may simultaneously submit booking requests for the same high-demand accommodation (e.g., Bed #2 in a shared apartment near Cairo University). A provider might accept multiple requests to negotiate.

When the mutual agreement confirmation step occurs, two students might confirm their respective agreements at the exact same millisecond. Without rigorous concurrency control, both transactions could evaluate the portion as available, resulting in a catastrophic double-booking.

### 3.2 The Mutual Agreement Concurrency Transaction

To make agreement confirmation strictly atomic and serializable without causing database-wide lock contention, the platform employs **Pessimistic Row-Level Locking** via `SELECT ... FOR UPDATE` on the target `availabilities` record within a PostgreSQL transaction.

#### Full Verbatim Concurrency Transaction:

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- ============================================================================
-- STEP 1: Acquire exclusive row-level lock on the target accommodation portion
-- ============================================================================
-- Any competing transaction attempting to confirm the same entity_type + entity_id
-- will block at this line until this transaction completes (COMMIT or ROLLBACK).
SELECT id, status, version
FROM availabilities
WHERE entity_type = $target_entity_type
  AND entity_id = $target_entity_id
FOR UPDATE;

-- ============================================================================
-- STEP 2: Verify Accommodation Availability Invariant
-- ============================================================================
-- If the status is not 'AVAILABLE', abort immediately with a domain conflict.
DO $$
DECLARE
    v_status VARCHAR(20);
BEGIN
    SELECT status INTO v_status
    FROM availabilities
    WHERE entity_type = $target_entity_type AND entity_id = $target_entity_id;

    IF v_status != 'AVAILABLE' THEN
        RAISE EXCEPTION 'ERR_PORTION_ALREADY_BOOKED: Accommodation portion is already booked or reserved.';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Verify Student Invariant (Max 1 Confirmed Booking per BR-BKG-002)
-- ============================================================================
DO $$
DECLARE
    v_confirmed_count INT;
BEGIN
    SELECT COUNT(*) INTO v_confirmed_count
    FROM booking_requests
    WHERE student_id = $student_id AND status = 'CONFIRMED';

    IF v_confirmed_count > 0 THEN
        RAISE EXCEPTION 'ERR_STUDENT_HAS_CONFIRMED_BOOKING: Student already holds a confirmed booking.';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Transition Availability State to BOOKED
-- ============================================================================
UPDATE availabilities
SET status = 'BOOKED',
    current_booking_request_id = $booking_request_id,
    version = version + 1,
    updated_at = clock_timestamp()
WHERE entity_type = $target_entity_type
  AND entity_id = $target_entity_id;

-- ============================================================================
-- STEP 5: Finalize Agreement Confirmation
-- ============================================================================
UPDATE agreement_confirmations
SET status = 'CONFIRMED',
    student_confirmed = true,
    student_confirmed_at = clock_timestamp(),
    confirmed_at = clock_timestamp(),
    updated_at = clock_timestamp()
WHERE id = $agreement_confirmation_id;

-- ============================================================================
-- STEP 6: Finalize Target Booking Request
-- ============================================================================
UPDATE booking_requests
SET status = 'CONFIRMED',
    updated_at = clock_timestamp()
WHERE id = $booking_request_id;

-- ============================================================================
-- STEP 7: Auto-Close Competing Pending & Accepted Requests (BR-AGR-003)
-- ============================================================================
-- All competing student requests for the exact same accommodation item
-- are transitioned to CLOSED_CONFLICT with system attribution.
UPDATE booking_requests
SET status = 'CLOSED_CONFLICT',
    cancelled_by = 'SYSTEM',
    cancellation_reason = 'Portion confirmed by competing student',
    updated_at = clock_timestamp()
WHERE target_entity_type = $target_entity_type
  AND target_entity_id = $target_entity_id
  AND id != $booking_request_id
  AND status IN ('PENDING', 'ACCEPTED');

COMMIT;
```

### 3.3 Concurrency Guarantees & Deadlock Prevention

1. **Zero Double-Bookings**: The row-level lock serializes concurrent confirmations. The first transaction to acquire the lock confirms the agreement; any concurrent transaction resumes after the commit, reads `status = 'BOOKED'`, and immediately rolls back with `ERR_PORTION_ALREADY_BOOKED`.
2. **Partial Availability Independence (`BR-BKG-005`)**: Locking Bed #2 in Room 101 only acquires a lock on the `availabilities` row where `entity_type = 'BED'` and `entity_id = <bed_2_uuid>`. Bed #1 and Bed #3 remain completely unlocked and available for concurrent confirmation.
3. **Deadlock Prevention Order**: All database updates follow an identical strict sequence across all modules:
   1. `availabilities` (Row lock)
   2. `agreement_confirmations`
   3. `booking_requests` (Target request)
   4. `booking_requests` (Competing auto-closure)
4. **Optimistic Locking Fallback**: The `version INT NOT NULL DEFAULT 1` column on `availabilities` provides an additional layer of protection for read-heavy API clients using ETag headers and optimistic locking checks (`WHERE version = :expectedVersion`).

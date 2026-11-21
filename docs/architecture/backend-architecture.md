# Egyptian Student Housing Platform — Backend Architecture Specification

**Document ID**: `ARCH-BE-001`  
**Version**: `1.0.0` (Phase 2 System Architecture)  
**Status**: `Approved Standard`  
**Target Application**: `apps/api` (NestJS Modular Monolith)  
**Architectural Decision Records**: `ADR-001` (Modular Monolith), `ADR-003` (NestJS Framework), `ADR-004` (PostgreSQL), `DEC-005` (3 Open Requests & 1 Confirmed Booking), `DEC-006` (Hierarchical Accommodation Model)

---

## 1. Architectural Strategy & Paradigm

### 1.1 In-Process Modular Monolith

The backend application (`apps/api`) is engineered as a **NestJS Modular Monolith** executed on Node.js 20 with TypeScript. It enforces strict domain encapsulation while executing within a single unified process.

Key design advantages:

1. **Elimination of Distributed Failure Modes**: Critical business operations (such as booking agreement confirmation) require atomic transactions across multiple domain entities. An in-process modular architecture executes these mutations within local ACID database transactions, eliminating the catastrophic failure modes of distributed Two-Phase Commit (2PC) or asynchronous Saga compensations.
2. **Strict Encapsulation Without Microservice Complexity**: Each business capability is modeled as an autonomous NestJS module with clear boundary rules, its own entities, DTOs, domain service, and controllers.
3. **Microsecond Internal Communication**: Cross-domain queries invoke strongly-typed service methods directly in-memory via NestJS Dependency Injection, avoiding serialization overhead and HTTP network latency.

---

## 2. Inventory of All 24 Domain Modules

The NestJS backend organizes all domain capabilities into 24 discrete modules per `app2.txt`:

| #   | Module Name              | Bounded Context & Responsibilities                                                                                                                                                             | Key Entities & Injected Services                                  |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | `AuthModule`             | Passwordless phone OTP generation/verification, JWT token issuance & refresh rotation, Passport strategies.                                                                                    | `User`, `OtpRecord`, `JwtService`, `SmsGatewayService`            |
| 2   | `UsersModule`            | Core identity management, user status flags (`ACTIVE`, `SUSPENDED`), role assignment (`STUDENT`, `OWNER`, `ADMIN`).                                                                            | `User`, `UsersService`, `UsersRepository`                         |
| 3   | `StudentsModule`         | Student profiles, verified university affiliations, academic faculty, emergency contacts, student preferences.                                                                                 | `StudentProfile`, `StudentsService`                               |
| 4   | `OwnersModule`           | Property provider profiles, provider types (`INDIVIDUAL_OWNER`, `AUTHORIZED_AGENT`, `MANAGEMENT_COMPANY`), company data.                                                                       | `OwnerProfile`, `OwnersService`                                   |
| 5   | `UniversitiesModule`     | Egyptian public & private universities, campuses, main campus coordinates, faculty listing.                                                                                                    | `University`, `Campus`, `UniversitiesService`                     |
| 6   | `LocationsModule`        | Egyptian geographic hierarchy: Governorates (e.g. Cairo, Giza, Alexandria), Cities, Areas/Neighborhoods.                                                                                       | `Governorate`, `City`, `Area`, `LocationsService`                 |
| 7   | `PropertiesModule`       | Top-level property entity (building or standalone apartment), street address, coordinates, amenities, listing approval status.                                                                 | `Property`, `PropertyImage`, `PropertiesService`                  |
| 8   | `UnitsModule`            | Physical residential apartments/units inside a building, floor number, total unit capacity, unit-level amenities.                                                                              | `PropertyUnit`, `UnitsService`                                    |
| 9   | `RoomsModule`            | Individual rooms within units, room classification (`PRIVATE_SINGLE`, `SHARED_DOUBLE`, `SHARED_TRIPLE`), private bath flag.                                                                    | `Room`, `RoomsService`                                            |
| 10  | `BedsModule`             | Individual bed spaces in shared rooms, bed identifiers, bed status.                                                                                                                            | `Bed`, `BedsService`                                              |
| 11  | `PricingModule`          | Multi-duration price matrices in Egyptian Pounds (EGP), pricing units (`PER_PERSON`, `PER_BED`, `PER_ROOM`, `PER_UNIT`), additional expenses (mandatory/optional, utility bills, maintenance). | `Pricing`, `AdditionalExpense`, `PricingService`                  |
| 12  | `AvailabilityModule`     | Availability states (`AVAILABLE`, `RESERVED`, `BOOKED`, `MAINTENANCE`), date range availability, partial capacity recalculation.                                                               | `Availability`, `AvailabilityService`                             |
| 13  | `SearchModule`           | Multi-parameter search queries, distance calculation to campus via Haversine / PostGIS, transparent matching sort algorithm.                                                                   | `SearchService`, `LocationsService`, `UniversitiesService`        |
| 14  | `BookingRequestsModule`  | Request submission lifecycle, student contact disclosure, cancellation, provider accept/reject, 3 active open requests guardrail.                                                              | `BookingRequest`, `BookingRequestsService`                        |
| 15  | `AgreementsModule`       | Mutual agreement confirmation, atomic transaction orchestration, 1 confirmed booking guardrail, automatic competing conflict closure.                                                          | `AgreementConfirmation`, `AgreementDocument`, `AgreementsService` |
| 16  | `MessagingModule`        | Request-linked text chat thread, message delivery, unread tracking, thread permanence across cancellations, WebSocket gateway.                                                                 | `Conversation`, `Message`, `MessagingGateway`                     |
| 17  | `NotificationsModule`    | In-app notification center, unread indicators, pluggable SMS transactional dispatching.                                                                                                        | `Notification`, `NotificationsService`, `SmsAdapter`              |
| 18  | `ReviewsModule`          | Post-confirmation review qualification, 1-5 star ratings, duplicate prevention, single provider response, moderation queue.                                                                    | `Review`, `ReviewResponse`, `ReviewsService`                      |
| 19  | `ReportsModule`          | Abuse/fraud reporting, progressive investigation status (`NEW`, `UNDER_REVIEW`, `RESOLVED`, `DISMISSED`), admin resolution notes.                                                              | `Report`, `ReportsService`                                        |
| 20  | `VerificationModule`     | Property provider KYC credential ingestion (National ID, property ownership deed / authorization), secure document storage ACL.                                                                | `PropertyVerification`, `SecureStorageService`                    |
| 21  | `SupportModule`          | Platform user support tickets, help inquiries, conflict resolution assistance.                                                                                                                 | `SupportTicket`, `SupportService`                                 |
| 22  | `AdminModule`            | Platform governance operations, manual superadmin setup, audit log viewer, moderation workflows.                                                                                               | `AdminActionLog`, `AdminService`                                  |
| 23  | `AnalyticsModule`        | Real-time supply, demand, average rental price trends per governorate and university, booking conversion metrics.                                                                              | `AnalyticsMetric`, `AnalyticsService`                             |
| 24  | `PlatformSettingsModule` | Platform-wide operational configuration, maintenance toggles, pilot launch governorate rules.                                                                                                  | `PlatformSetting`, `PlatformSettingsService`                      |

---

## 3. Dependency Injection & Module Boundaries

### 3.1 Strict Isolation Rules

To guarantee architectural integrity:

1. **Rule 1: No Direct Cross-Module Repository Injection**:
   ```typescript
   // ❌ FORBIDDEN: Modules must never inject repositories from other modules
   @Injectable()
   export class BookingRequestsService {
     constructor(
       @InjectRepository(Property) private propertyRepo: Repository<Property>, // VIOLATION
     ) {}
   }

   // ✅ MANDATORY: Inject the domain service exported by the owning module
   @Injectable()
   export class BookingRequestsService {
     constructor(
       private readonly propertiesService: PropertiesService, // COMPLIANT
       private readonly availabilityService: AvailabilityService,
     ) {}
   }
   ```
2. **Rule 2: Asynchronous Event Decoupling**:
   - Secondary actions that do not affect transaction commit state must be dispatched as domain events via `@nestjs/event-emitter`.
   - Examples: `booking.created`, `booking.confirmed`, `message.sent`, `listing.approved`.
3. **Rule 3: Encapsulated DTO Contracts**:
   - Modules expose public DTOs for method parameters and return types. Direct entity leakages across module boundaries are minimized.

---

## 4. Hierarchical Accommodation & Partial Availability Model

### 4.1 Four-Tier Physical Hierarchy

Per `app.txt` (§5.2, §8) and `DEC-006`, the platform models student housing as an explicit four-tier physical hierarchy:

```
Property (Building / Apartment)
   │
   └── PropertyUnit (Apartment / Floor)
          │
          └── Room (Private / Shared)
                 │
                 └── Bed (Individual Bed Space)
```

### 4.2 Partial Availability Locking Mechanics

A critical requirement is that booking confirmation for an individual bed or room must **never** inadvertently lock an entire unit or building.

- Every bookable accommodation portion has an associated record in the `Availability` entity, referencing `targetEntityType` (`UNIT`, `ROOM`, or `BED`) and `targetEntityId`.
- When a Bed is booked:
  - Only the targeted `Bed` record is set to `BOOKED`.
  - The parent `Room` recalculates its remaining available capacity (e.g., from 3 available beds down to 2).
  - The parent `PropertyUnit` and `Property` remain `AVAILABLE` as long as at least one constituent portion remains unbooked.

---

## 5. Concurrency Control & The Atomic Agreement Confirmation Sequence

### 5.1 Business Guardrails (Per `app.txt` §8 & `DEC-005`)

1. **Max 3 Active Open Requests**: A student may not maintain more than three active open booking requests (`PENDING` or `ACCEPTED`) across the entire platform concurrently.
2. **Max 1 Confirmed Booking**: A student may have at most **one** confirmed booking (`CONFIRMED`). A student with a confirmed booking is barred from submitting new requests.
3. **Automatic Competing Request Closure**: When an agreement confirmation is finalized for an accommodation portion, all other competing open requests (`PENDING` or `ACCEPTED`) targeting that exact same portion must be closed automatically with status `CLOSED_CONFLICT`.

### 5.2 Step-by-Step Transaction Sequence (`SELECT ... FOR UPDATE`)

To eliminate race conditions when two students or owners attempt to confirm the same room simultaneously, the platform uses PostgreSQL pessimistic write locking within a serializable database transaction:

```typescript
// apps/api/src/modules/agreements/agreements.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BookingRequest,
  BookingRequestStatus,
} from '../booking-requests/entities/booking-request.entity';
import { Availability, AvailabilityStatus } from '../availability/entities/availability.entity';
import { AgreementConfirmation, AgreementStatus } from './entities/agreement-confirmation.entity';
import { BookingConfirmedEvent } from './events/booking-confirmed.event';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Atomically confirms a mutual rental agreement with pessimistic row-locking.
   */
  async confirmAgreement(
    agreementId: string,
    confirmingUserId: string,
  ): Promise<AgreementConfirmation> {
    return await this.dataSource.transaction('SERIALIZABLE', async manager => {
      // 1. Fetch Agreement and verify readiness
      const agreement = await manager.findOne(AgreementConfirmation, {
        where: { id: agreementId },
        relations: ['bookingRequest'],
      });

      if (!agreement) {
        throw new BadRequestException('Agreement record not found.');
      }
      if (agreement.status === AgreementStatus.CONFIRMED) {
        throw new ConflictException('This agreement has already been confirmed.');
      }

      const bookingRequestId = agreement.bookingRequest.id;
      const studentId = agreement.bookingRequest.studentId;
      const targetType = agreement.bookingRequest.targetEntityType;
      const targetId = agreement.bookingRequest.targetEntityId;

      // 2. Pessimistic Write Lock on target Availability record
      // Equivalent SQL: SELECT * FROM availability WHERE target_entity_type = $1 AND target_entity_id = $2 FOR UPDATE;
      const availability = await manager
        .createQueryBuilder(Availability, 'avail')
        .setLock('pessimistic_write')
        .where('avail.target_entity_type = :targetType AND avail.target_entity_id = :targetId', {
          targetType,
          targetId,
        })
        .getOne();

      if (!availability || availability.status !== AvailabilityStatus.AVAILABLE) {
        throw new ConflictException('The requested accommodation portion is no longer available.');
      }

      // 3. Enforce Single Confirmed Booking Constraint
      const existingConfirmedCount = await manager.count(BookingRequest, {
        where: {
          studentId: studentId,
          status: BookingRequestStatus.CONFIRMED,
        },
      });

      if (existingConfirmedCount > 0) {
        throw new ConflictException(
          'Student already has an active confirmed booking on the platform.',
        );
      }

      // 4. Update Agreement Confirmation status
      agreement.status = AgreementStatus.CONFIRMED;
      agreement.confirmedAt = new Date();
      agreement.confirmedByUserId = confirmingUserId;
      await manager.save(AgreementConfirmation, agreement);

      // 5. Update Target Booking Request status
      await manager.update(
        BookingRequest,
        { id: bookingRequestId },
        {
          status: BookingRequestStatus.CONFIRMED,
          updatedAt: new Date(),
        },
      );

      // 6. Transition Portion Availability to BOOKED
      await manager.update(
        Availability,
        { id: availability.id },
        {
          status: AvailabilityStatus.BOOKED,
          lastUpdated: new Date(),
        },
      );

      // 7. Atomically Close All Other Competing Requests for This Exact Portion
      // Closes all PENDING or ACCEPTED requests for this portion except the currently confirmed one
      await manager
        .createQueryBuilder()
        .update(BookingRequest)
        .set({
          status: BookingRequestStatus.CLOSED_CONFLICT,
          cancellationReason:
            'Automatically closed: accommodation portion confirmed by another party.',
          updatedAt: new Date(),
        })
        .where('target_entity_type = :targetType AND target_entity_id = :targetId', {
          targetType,
          targetId,
        })
        .andWhere('id != :confirmedRequestId', { confirmedRequestId: bookingRequestId })
        .andWhere('status IN (:...competingStatuses)', {
          competingStatuses: [BookingRequestStatus.PENDING, BookingRequestStatus.ACCEPTED],
        })
        .execute();

      return agreement;
    });

    // 8. Publish Domain Event outside the transaction boundary
    this.eventEmitter.emit(
      'booking.confirmed',
      new BookingConfirmedEvent(agreementId, confirmingUserId),
    );
  }
}
```

---

## 6. CQRS-Lite & Query Performance Optimization

### 6.1 Spatial Search Query Engine (`SearchModule`)

Spatial searches must execute in under 100ms across tens of thousands of accommodations in Cairo and Giza.

- **Query Strategy**: The `SearchService` separates complex spatial queries from transactional entities.
- **Index Optimization**:
  - GIST composite spatial index on `(latitude, longitude)`.
  - Composite indexes on `(status, city_id, target_entity_type)`.
  - Index on `pricing.price_amount`.
- **Haversine Formula**: Computes exact straight-line distance in kilometers to the target university campus coordinates:
  ```sql
  SELECT p.*,
    (6371 * acos(
      cos(radians(:campusLat)) * cos(radians(p.latitude)) *
      cos(radians(p.longitude) - radians(:campusLng)) +
      sin(radians(:campusLat)) * sin(radians(p.latitude))
    )) AS distance_km
  FROM properties p
  WHERE p.status = 'APPROVED'
  ORDER BY distance_km ASC;
  ```

### 6.2 Transparent Student Matching Sort (Per `DEC-007`)

Sorting is strictly objective and transparent:

1. Distance to selected university campus (ascending).
2. Base monthly rental price (ascending).
3. Verification tier of the property provider (verified providers prioritized).
4. No hidden paid algorithmic boosting or artificial ranking distortion.

# Testing Architecture & Automated Verification Framework

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب في مصر)
- **Specification Document**: Phase 3 Technical Design & Developer Guides
- **Document Path**: `docs/development/testing.md`
- **Frameworks**: Jest, Vitest, Supertest, React Testing Library, Zod
- **Methodology**: Behavior-Driven Cleanroom Architecture (Zero Facades, Real Concurrency Verification)

---

## 1. Testing Philosophy & Integrity Mandate

The Sakany testing architecture is designed to guarantee the correctness, safety, and performance of critical housing transactions while adhering strictly to the **Cleanroom Testing Mandate**.

```
                          ▲
                         / \
                        /   \
                       / E2E \         End-to-End User Journeys (Supertest / Playwright)
                      /-------\        - Registration -> Request -> Mutual Agreement -> Review
                     / Integ   \       Database & Concurrency Integration Tests
                    /-----------\      - Row-level locking, partial availability, auto-closure
                   /    Unit     \     Pure Unit & Validation Schema Tests
                  /---------------\    - Zod schemas, pricing calculators, guards, state machines
```

### Core Testing Mandates:

1. **Behavior Verification Over Implementation Details**: Every test answers: _"If this test fails, what business rule or data integrity invariant is violated?"_ Tests assert observable behaviors, HTTP contracts, and database states.
2. **Zero Facades & Honest Implementations**: Test results and business behaviors must never be simulated with hardcoded return values or fake stubs. All transactional tests execute against a real PostgreSQL instance with genuine table rows and real transactional locks.
3. **Cleanroom Principle**: Test cases are derived strictly from product specifications (`app.txt`, `app2.txt`, `PROJECT.md`), never reverse-engineered by reading pre-existing test source code.
4. **Stateful Isolation & Determinism**: Each test suite manages its own lifecycle using transactional rollbacks or ephemeral database schemas, ensuring that tests remain independent, repeatable, and non-flaky.

---

## 2. Comprehensive Test Commands Reference

All testing commands can be invoked from the monorepo root or targeted directly to specific packages via npm workspaces:

| Command                    | Scope              | Tool / Engine    | Purpose                                                               |
| -------------------------- | ------------------ | ---------------- | --------------------------------------------------------------------- |
| `npm run test`             | All Workspaces     | Jest / Vitest    | Runs all unit and validation tests across the monorepo                |
| `npm run test:validation`  | `@repo/validation` | Vitest           | Validates Zod schemas, phone regex, and Egyptian business constraints |
| `npm run test:api`         | `@repo/api`        | Jest             | Runs NestJS controller and service unit tests (`*.spec.ts`)           |
| `npm run test:web`         | `@repo/web`        | Vitest / RTL     | Runs React component and client hook tests                            |
| `npm run test:integration` | `@repo/api`        | Supertest + Jest | Runs database integration and transactional concurrency suites        |
| `npm run test:e2e`         | `@repo/api`        | Supertest + Jest | Executes end-to-end multi-role API user journeys                      |
| `npm run test:cov`         | `@repo/api`        | Istanbul / Jest  | Generates backend unit and integration test coverage reports          |

---

## 3. Test Suites by Monorepo Layer

### 3.1 Shared Packages Testing (`packages/validation` & `packages/shared-types`)

- **Scope**: Tests pure functions, validation schemas, phone formatting, price calculations, and enum invariants.
- **Tools**: Vitest.
- **Location**: `packages/validation/src/**/*.spec.ts`

#### Example: Egyptian Mobile Number & Student Registration Validation

```typescript
import { describe, it, expect } from 'vitest';
import { studentRegisterSchema } from '../src/auth.schema';

describe('Student Registration Validation Schema', () => {
  it('should accept valid Egyptian mobile numbers with +20 prefix', () => {
    const validPayload = {
      phone: '+201012345678',
      fullName: 'أحمد محمود',
      universityId: 'b2c9d1a4-8451-4091-a128-4f81014a6721',
      gender: 'MALE',
      academicYear: 'YEAR_2',
    };
    const result = studentRegisterSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject numbers without Egyptian mobile carrier prefixes (010, 011, 012, 015)', () => {
    const invalidPayload = {
      phone: '+201912345678', // Invalid prefix 019
      fullName: 'أحمد محمود',
      universityId: 'b2c9d1a4-8451-4091-a128-4f81014a6721',
      gender: 'MALE',
    };
    const result = studentRegisterSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain('ERR_INVALID_PHONE_NUMBER');
    }
  });

  it('should reject non-Egyptian international phone numbers', () => {
    const nonEgyptianPayload = {
      phone: '+966501234567', // Saudi number
      fullName: 'John Doe',
      universityId: 'b2c9d1a4-8451-4091-a128-4f81014a6721',
      gender: 'MALE',
    };
    const result = studentRegisterSchema.safeParse(nonEgyptianPayload);
    expect(result.success).toBe(false);
  });
});
```

---

### 3.2 Backend Unit Testing (`apps/api/src/**/*.spec.ts`)

- **Scope**: Verifies discrete domain logic in NestJS services, custom decorators, role guards (`RolesGuard`), ownership guards, and global exception filters.
- **Tools**: NestJS Testing Module, Jest.
- **Rule**: External network I/O and database operations are mocked using repository interfaces.

#### Key Areas Tested:

1. **Authentication Service**: Password hashing with bcrypt, OTP expiry verification, JWT token generation, refresh token verification.
2. **Booking Rule Guard (`BR-BKG-001`)**: Verification that a student cannot create a 4th open booking request when holding 3 `PENDING` or `ACCEPTED` requests.
3. **Bilateral Agreement State Machine**: Ensuring agreement transitions only to `CONFIRMED` when both `student_confirmed` and `owner_confirmed` are true.
4. **Geodesic Distance Calculator**: Verifying that Haversine formulas accurately compute distances in kilometers between property coordinates and university main campuses.

---

### 3.3 Database Integration & Concurrency Testing (`apps/api/test/integration/`)

Integration tests run against a real PostgreSQL 16 container. They exercise full transaction isolation levels (`READ COMMITTED` or `SERIALIZABLE`) and verify that row-level locking eliminates race conditions.

#### Concurrency Test Case: Double-Booking Prevention via Row-Level Locking (`SELECT FOR UPDATE`)

This test simulates two students concurrently confirming mutual agreements for the exact same accommodation bed. The system must guarantee that exactly one confirmation succeeds while the other fails with a `409 Conflict`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHarness } from '../utils/test-harness';

describe('Concurrency Integration: Double-Booking Prevention', () => {
  let app: INestApplication;
  let harness: TestHarness;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    harness = new TestHarness(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should serialize simultaneous agreement confirmations, allowing exactly one and rejecting competing with 409 Conflict', async () => {
    // 1. Arrange: Create a single available bed inside a shared room
    const bed = await harness.createBedWithAvailability({ status: 'AVAILABLE' });

    // 2. Arrange: Create two verified students with active auth tokens
    const studentA = await harness.createStudentUser();
    const studentB = await harness.createStudentUser();

    // 3. Arrange: Create two accepted booking requests targeting the exact same bed
    const requestA = await harness.createAcceptedBooking({
      studentId: studentA.id,
      targetEntityType: 'BED',
      targetEntityId: bed.id,
    });
    const requestB = await harness.createAcceptedBooking({
      studentId: studentB.id,
      targetEntityType: 'BED',
      targetEntityId: bed.id,
    });

    // 4. Act: Fire concurrent HTTP confirmation requests simultaneously
    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/agreements/${requestA.agreementId}/confirm-student`)
        .set('Authorization', `Bearer ${studentA.token}`)
        .send({ termsAccepted: true }),
      request(app.getHttpServer())
        .post(`/api/v1/agreements/${requestB.agreementId}/confirm-student`)
        .set('Authorization', `Bearer ${studentB.token}`)
        .send({ termsAccepted: true }),
    ]);

    // 5. Assert: One request succeeded (200 OK) and the other was rejected (409 Conflict)
    const statusCodes = [resA.status, resB.status].sort();
    expect(statusCodes).toEqual([200, 409]);

    const failedResponse = resA.status === 409 ? resA.body : resB.body;
    expect(failedResponse.success).toBe(false);
    expect(failedResponse.errorCode).toBe('ERR_PORTION_ALREADY_BOOKED');

    // 6. Assert: Target bed availability in database is now 'BOOKED'
    const updatedBedAvailability = await harness.getAvailability('BED', bed.id);
    expect(updatedBedAvailability.status).toBe('BOOKED');

    // 7. Assert: Competing booking request was auto-closed to CLOSED_CONFLICT (BR-AGR-003)
    const failedBookingId = resA.status === 409 ? requestA.bookingId : requestB.bookingId;
    const competingBooking = await harness.getBookingRequest(failedBookingId);
    expect(competingBooking.status).toBe('CLOSED_CONFLICT');
    expect(competingBooking.cancellationReason).toContain('competing student');
  });
});
```

#### Partial Availability Locking Verification (`BR-AGR-002`)

The test suite also verifies that booking a single bed (`Bed #1`) in a room does **not** lock `Bed #2` in the same room. `Bed #2` must remain `AVAILABLE` and accept new booking requests.

---

### 3.4 End-to-End (E2E) Multi-Role User Journey Testing

E2E tests verify the complete product flow from registration to post-rental reviews across all three user roles (`STUDENT`, `OWNER`, `ADMIN`):

```
+----------------------------------------------------------------------------------------------------+
|                                    END-TO-END VERIFICATION FLOW                                    |
+----------------------------------------------------------------------------------------------------+
| 1. Owner Registration  --> Upload KYC Documents (National ID & Deed)                              |
| 2. Admin Verification  --> Admin reviews & approves KYC (Provider status -> VERIFIED)              |
| 3. Property Listing    --> Owner creates Building -> Unit -> Rooms -> Beds with EGP Pricing        |
| 4. Admin Moderation    --> Admin reviews & publishes property listing                              |
| 5. Student Discovery   --> Student registers with OTP (+20) -> Searches properties near Cairo Univ|
| 6. Booking Submission  --> Student submits booking request (Reveals contact info immediately)      |
| 7. Owner Acceptance    --> Owner reviews & accepts booking request                                 |
| 8. Mutual Agreement    --> Student & Owner confirm agreement -> Row lock fires -> Bed marked BOOKED|
| 9. Post-Booking Review --> Student submits 5-star review -> Owner submits single public response   |
+----------------------------------------------------------------------------------------------------+
```

---

### 3.5 Frontend Component Testing (`apps/web/test/`)

- **Scope**: Verifies Next.js UI rendering, Egyptian Arabic RTL layout, Tailwind responsive styles, and interactive state.
- **Tools**: Vitest, React Testing Library, `@testing-library/jest-dom`.
- **Location**: `apps/web/src/**/*.test.tsx`

#### Key UI Scenarios Tested:

1. **Bilingual Directionality**: Verifies that rendering in `ar` sets `dir="rtl"` on containers and renders Arabic typography (Cairo font), while `en` renders `dir="ltr"`.
2. **Property Card Component**: Verifies proper currency formatting in Egyptian Pounds (`3,500 ج.م`), distance badge calculation (`1.2 كم من جامعة القاهرة`), and cover photo rendering.
3. **Search Filter Bar**: Verifies that filtering by city, area, and gender policy (`MALE_ONLY`, `FEMALE_ONLY`) dispatches correctly formatted query parameters to the API client.
4. **Immediate Contact Disclosure**: Verifies that after booking submission, the student UI immediately exposes the provider's phone and email per `BR-CON-001`.

---

## 4. Mocking Strategies & Pluggable Gateways

To maintain test speed and independence from external cloud providers, all third-party integrations are abstracted behind clean TypeScript interfaces. Test suites plug in mock adapters that produce deterministic responses without external network traffic.

```
+----------------------------------+------------------------------------+------------------------------------+
| Integration Gateway              | Production Implementation          | Test / Local Mock Implementation   |
+----------------------------------+------------------------------------+------------------------------------+
| **SMS Gateway**                  | Live Aggregator (Twilio / Local)   | `MockSmsGatewayProvider`           |
| (`ISmsGateway`)                  | Dispatches real SMS over cellular  | Logs OTP code to memory / logger   |
+----------------------------------+------------------------------------+------------------------------------+
| **Asset Storage**                | Cloudinary Media Cloud             | `LocalStorageProvider`             |
| (`IStorageProvider`)             | Uploads to Cloudinary CDN          | Saves to memory / ephemeral tmp dir|
+----------------------------------+------------------------------------+------------------------------------+
| **Geocoding & Proximity**        | Google Maps Geocoding & Distance   | `HaversineGeocodingProvider`       |
| (`IGeocodingService`)            | HTTP calls to Google Maps API      | Deterministic spherical distance   |
+----------------------------------+------------------------------------+------------------------------------+
```

### 4.1 Mock SMS Gateway Implementation Details

- During automated testing (`NODE_ENV=test`), `MockSmsGatewayProvider` intercepts OTP dispatches.
- It stores the dispatched OTP in an in-memory map keyed by phone number.
- In tests, the verification endpoint accepts `123456` or the captured in-memory OTP code without delay or external network calls.

### 4.2 Mock Asset Storage Implementation Details

- Property photos and KYC documents uploaded during tests are captured as `Buffer` streams in memory or written to an ephemeral `tmp/test-uploads/` directory.
- Test suites run clean teardown hooks (`afterAll`) to delete temporary files.

### 4.3 Deterministic Geocoding

- Seeded coordinates for Egyptian universities (e.g. Cairo University: `30.0276, 31.2101`) are used directly in tests.
- Proximity calculations utilize the mathematical Haversine formula over geographic coordinates, eliminating external API latency and rate limits.

---

## 5. Test Database Isolation & Ephemeral Teardown

To ensure test determinism and prevent test contamination:

1. **Test Database Configuration**: Tests connect to a dedicated database (`student_housing_test`) configured in `.env.test`.
2. **Transaction Rollback Pattern**: Integration tests execute inside a PostgreSQL transaction (`BEGIN`) and execute `ROLLBACK` in `afterEach` hooks when testing read-write logic, leaving the database pristine.
3. **Migration Pre-Flight**: CI workflows run `npm run migration:run` against the test database before launching integration and E2E suites.
4. **Seed Reset Fixtures**: A `TestHarness` utility provides helper methods (`createStudentUser`, `createVerifiedOwner`, `createPropertyListing`) that generate randomized UUIDs and unique Egyptian phone numbers (`+2010...`) for every test iteration.

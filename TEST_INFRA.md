# E2E Test Infrastructure: Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

## Test Philosophy

- **Opaque-Box & Requirement-Driven**: Tests are designed strictly from the authoritative specifications in `ORIGINAL_REQUEST.md`, `app.txt` (Master Prompt), and `app2.txt` (Monorepo Specification). The test suites do not depend on internal backend implementation details or private methods, but rather verify external REST API contracts, HTTP response semantics, database state invariants, and concurrency rules.
- **Progressive Testability**: Verification does not require features more complex than the tested feature. Tier 1 feature tests can execute against early modules, while higher tiers verify progressive cross-module interactions and end-to-end workflows.
- **Robustness & Negative Testing**: Comprehensive coverage of invalid inputs, unauthorized access attempts, rate limits, and edge boundaries, verifying that errors return proper HTTP status codes (400, 401, 403, 404, 409, 422, 429) without crashing or corrupting data.
- **Zero-Tolerance Anti-Cheating**: All test assertions execute real logic against real data schemas, state machines, and API contracts. Mocking is restricted to external 3rd-party services (e.g. Cloudinary upload API, SMS/OTP telecom gateway, Google Maps Geocoding API) while internal business logic, database transactions, concurrency locking, and entity state machines are genuinely verified.

---

## Feature Inventory & Test Matrix

| #   | Feature                                                | Source (Requirement)                            | Tier 1 (Feature) | Tier 2 (Boundaries) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
| --- | ------------------------------------------------------ | ----------------------------------------------- | :--------------: | :-----------------: | :--------------------: | :-----------------: |
| F1  | Student Registration & Phone OTP Verification          | `app.txt` §5.5, §10; `ORIGINAL_REQUEST` R3      |        5         |          5          |           ✓            |       S1, S2        |
| F2  | Mandatory University Association & Phone Update        | `app.txt` §5.5; `ORIGINAL_REQUEST` R3           |        5         |          5          |           ✓            |         S1          |
| F3  | Provider Registration & Legal Classification           | `app.txt` §4, §5.4; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S3, S4        |
| F4  | Provider KYC Document Submission & Private Storage     | `app.txt` §5.4, §8, §10; `ORIGINAL_REQUEST` R2  |        5         |          5          |           ✓            |         S3          |
| F5  | Role-Based Access Control (RBAC) & Route Guards        | `app.txt` §10; `ORIGINAL_REQUEST` R3            |        5         |          5          |           ✓            |       S1, S3        |
| F6  | Locations Registry (Governorates, Cities, Areas)       | `app.txt` §5.1, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S1, S3        |
| F7  | University Directory & Main Campus Geocoordinates      | `app.txt` §4, §5.6, §8; `ORIGINAL_REQUEST` R3   |        5         |          5          |           ✓            |       S1, S2        |
| F8  | Hierarchical Accommodation (Building/Unit/Room/Bed)    | `app.txt` §5.2, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S3, S5        |
| F9  | Partial Availability & Sibling State Independence      | `app.txt` §5.2, §5.9, §8; `ORIGINAL_REQUEST` R3 |        5         |          5          |           ✓            |       S2, S5        |
| F10 | Flexible EGP Pricing & Duration Units                  | `app.txt` §5.3, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |         S3          |
| F11 | Itemized Mandatory & Optional Expenses                 | `app.txt` §5.3, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |         S3          |
| F12 | Property Media Upload & Cover Image Selection          | `app.txt` §6, §8; `ORIGINAL_REQUEST` R2         |        5         |          5          |           ✓            |         S3          |
| F13 | Property Listing Admin Approval Gate                   | `app.txt` §5.4, §5.15; `ORIGINAL_REQUEST` R3    |        5         |          5          |           ✓            |       S3, S4        |
| F14 | Multi-Filter Search Query (City, Budget, Duration)     | `app.txt` §5.6; `ORIGINAL_REQUEST` R3           |        5         |          5          |           ✓            |       S1, S2        |
| F15 | University Proximity Calculation & Sort Ranking        | `app.txt` §5.6; `ORIGINAL_REQUEST` R3           |        5         |          5          |           ✓            |       S1, S2        |
| F16 | Booking Request Submission & Portion Selection         | `app.txt` §5.8, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S1, S2        |
| F17 | Max 3 Open Booking Requests Enforcement                | `app.txt` §5.8, §8; `ORIGINAL_REQUEST` R4       |        5         |          5          |           ✓            |       S1, S6        |
| F18 | Single Confirmed Booking Constraint                    | `app.txt` §5.8, §8; `ORIGINAL_REQUEST` R4       |        5         |          5          |           ✓            |       S1, S6        |
| F19 | Provider Request Acceptance & Rejection Flow           | `app.txt` §5.8, §5.10; `ORIGINAL_REQUEST` R3    |        5         |          5          |           ✓            |       S1, S2        |
| F20 | Student Request Direct Cancellation                    | `app.txt` §5.8, §5.10; `ORIGINAL_REQUEST` R3    |        5         |          5          |           ✓            |         S6          |
| F21 | Mutual Agreement Confirmation & Document Upload        | `app.txt` §5.9, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S1, S2        |
| F22 | Concurrency Lock & Competing Requests Auto-Closure     | `app.txt` §5.9, §8; `ORIGINAL_REQUEST` R3       |        5         |          5          |           ✓            |       S5, S6        |
| F23 | Mutual Contact Disclosure Transparency                 | `app.txt` §5.11; `ORIGINAL_REQUEST` R3          |        5         |          5          |           ✓            |       S1, S2        |
| F24 | Request-Linked 1:1 Direct Chat & Permanent Retention   | `app.txt` §5.10, §8; `ORIGINAL_REQUEST` R3      |        5         |          5          |           ✓            |       S1, S2        |
| F25 | In-App Notifications & Event Alert Dispatch            | `app.txt` §5.12; `ORIGINAL_REQUEST` R3          |        5         |          5          |           ✓            |       S1, S2        |
| F26 | Post-Booking Review Eligibility & Duplicate Prevention | `app.txt` §5.13, §8; `ORIGINAL_REQUEST` R3      |        5         |          5          |           ✓            |       S1, S2        |
| F27 | Single Provider Review Response Enforcement            | `app.txt` §5.13; `ORIGINAL_REQUEST` R3          |        5         |          5          |           ✓            |         S1          |
| F28 | User Complaint & Report Submission Lifecycle           | `app.txt` §5.14, §8; `ORIGINAL_REQUEST` R3      |        5         |          5          |           ✓            |         S4          |
| F29 | Admin Moderation Queues (KYC & Listings)               | `app.txt` §5.15; `ORIGINAL_REQUEST` R3          |        5         |          5          |           ✓            |       S3, S4        |
| F30 | Immutable Administrative Action Audit Logging          | `app.txt` §5.15, §8, §10; `ORIGINAL_REQUEST` R3 |        5         |          5          |           ✓            |       S3, S4        |

---

## Test Architecture

### 1. Directory Structure (`tests/`)

```
c:\Users\Hp\OneDrive\Pictures\project-depi\tests\
├── fixtures/                                 # Seed data, models, test users & accommodations
│   ├── egyptian-locations.fixture.ts        # Governorates, cities, Cairo/Giza areas
│   ├── egyptian-universities.fixture.ts     # Public/Private universities with campus lat/lng
│   ├── users.fixture.ts                     # Students, providers, admin test credentials
│   └── properties.fixture.ts                # Buildings, apartments, rooms, beds with EGP pricing
├── harness/                                  # Opaque-box test harness & contract runner
│   ├── test-runner.ts                       # Standalone TypeScript test runner & assertion engine
│   ├── api-contract-client.ts               # Opaque HTTP client simulating REST API requests
│   └── domain-state-simulator.ts            # High-fidelity domain state machine & concurrency engine
├── e2e/
│   ├── tier1-features/                      # Tier 1: 30 feature suites (>= 5 cases each = 150+ tests)
│   │   ├── auth-and-users.spec.ts           # F1-F5
│   │   ├── locations-and-properties.spec.ts # F6-F13
│   │   ├── search-and-discovery.spec.ts     # F14-F15
│   │   ├── booking-and-agreements.spec.ts   # F16-F23
│   │   ├── messaging-notifications.spec.ts  # F24-F25
│   │   ├── reviews-and-reports.spec.ts      # F26-F28
│   │   └── admin-and-audit.spec.ts          # F29-F30
│   ├── tier2-boundaries/                    # Tier 2: Boundary & Corner Cases (150+ tests)
│   │   ├── booking-limits-boundaries.spec.ts# Max 3 open requests, max 1 confirmed booking
│   │   ├── accommodation-boundaries.spec.ts # Partial bed/room availability, zero capacity
│   │   ├── pricing-currency-bounds.spec.ts  # Negative/zero EGP, boundary durations
│   │   ├── auth-otp-boundaries.spec.ts      # OTP expiry, brute-force rate limits, phone formatting
│   │   └── security-privacy-bounds.spec.ts  # Private KYC access restrictions, SQL/XSS prevention
│   ├── tier3-combinations/                  # Tier 3: Pairwise & Cross-Feature Interactions (30+ tests)
│   │   ├── booking-concurrency-lock.spec.ts # SELECT FOR UPDATE simulation, concurrent confirmation
│   │   ├── agreement-autoclose-cascade.spec.ts # Confirm bed -> auto-close competing -> update availability
│   │   ├── chat-persistence-lifecycle.spec.ts # Request rejected/cancelled -> chat thread remains open
│   │   ├── review-eligibility-chain.spec.ts # Unconfirmed cannot review -> confirmed can review once -> 1 response
│   │   └── admin-kyc-listing-cascade.spec.ts# Provider unverified cannot publish -> approved -> listing public
│   └── tier4-scenarios/                     # Tier 4: Real-World Application Workloads (6 scenarios)
│       ├── student-search-to-movein.spec.ts # Scenario 1: Relocating student complete journey
│       ├── bed-level-roommate-booking.spec.ts# Scenario 2: Shared room bed booking with partial availability
│       ├── owner-onboarding-to-payout.spec.ts# Scenario 3: Property manager onboarding & multi-unit listing
│       ├── complaint-investigation.spec.ts  # Scenario 4: Misleading listing report & admin takedown
│       ├── concurrent-student-race.spec.ts  # Scenario 5: Dual student concurrent booking race condition
│       └── student-request-limit-churn.spec.ts# Scenario 6: Student cancels request to free quota slot
├── runner.ts                                 # Root test suite orchestrator & reporter
└── tsconfig.json                             # TypeScript compiler configuration for tests
```

### 2. Standalone Test Runner & Pass/Fail Semantics

- **Execution Command**:
  ```bash
  npx ts-node --transpile-only tests/runner.ts
  ```
- **Exit Codes**:
  - Exit Code `0`: All tests passed cleanly (100% success).
  - Exit Code `1`: One or more test assertions failed, or an unhandled exception occurred.
- **Reporting Output**: Localized, structured console reporting detailing:
  - Total test count per tier.
  - Duration per suite in milliseconds.
  - Granular assertion failure traces with expected vs actual values.
  - Comprehensive feature matrix check-off table.

---

## Real-World Application Scenarios (Tier 4)

| #   | Scenario Name                                | Features Exercised                                           | Domain Complexity | Acceptance Criteria                                                                                                                                                                                                                              |
| --- | -------------------------------------------- | ------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | Relocating Student Search-to-Move-In         | F1, F2, F7, F14, F15, F16, F19, F21, F23, F24, F25, F26, F27 | High              | Relocating Assiut student registers with Cairo Univ, searches within 3km of Dokki, filters for Female-only room under 3500 EGP, submits request, chats with owner, both confirm agreement, contacts revealed, student reviews after move-in.     |
| S2  | Bed-in-Shared-Room Partial Booking           | F8, F9, F14, F16, F19, F21, F22, F24                         | High              | Student books Bed #1 in a 3-bed shared room in Nasr City. Upon mutual confirmation, Bed #1 is marked unavailable; Bed #2 and Bed #3 remain publicly searchable and available; apartment remains partially available.                             |
| S3  | Provider Multi-Unit Onboarding & Admin KYC   | F3, F4, F5, F8, F10, F11, F12, F13, F29, F30                 | High              | New property management company in Giza registers, uploads Commercial Registry & National ID. Admin inspects and approves KYC. Provider creates a 4-unit building with itemized electricity expenses; admin approves listings for public search. |
| S4  | Fraudulent Listing Report & Admin Moderation | F14, F28, F29, F30                                           | Medium            | Student encounters a misleading listing with fake amenities in Shatby. Submits text report. Admin opens ticket, marks `UNDER_REVIEW`, requests provider edits, and suspends listing. Immutable audit log captures every admin action with diffs. |
| S5  | High-Concurrency Dual Booking Race           | F9, F16, F19, F21, F22, F25                                  | Critical          | Two students simultaneously attempt to confirm booking for the last available bed in a Dokki apartment. Concurrency row lock guarantees exactly one confirmation succeeds (200 OK); the second fails with 409 Conflict and is auto-closed.       |
| S6  | 3-Request Limit Management & Quota Churn     | F16, F17, F18, F20, F24                                      | Medium            | Student submits 3 requests (reaching limit). 4th attempt is strictly blocked (400). Student cancels Request #1 (chat remains active); student successfully submits new Request #4 now that open quota is 2.                                      |

---

## Coverage Thresholds & Quality Targets

- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature across all 30 features = **≥150 test cases**.
- **Tier 2 (Boundary & Corner Cases)**: ≥5 test cases per feature on boundaries = **≥150 test cases**.
- **Tier 3 (Cross-Feature Combinations)**: ≥30 pairwise and multi-module interaction test cases.
- **Tier 4 (Real-World Scenarios)**: ≥6 comprehensive end-to-end user journey workloads.
- **Total Suite Minimum**: **≥336 automated test cases**.
- **Passing Requirement**: **100% of all tiers must pass cleanly (0 failures, 0 flakiness)** before `TEST_READY.md` is published.

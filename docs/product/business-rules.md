# Business Rules Engine Specification

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Overview & Architectural Principles

This document formalizes all business rules and domain invariants governing the Egyptian Student Housing Platform in strict adherence to `app.txt` (Sections 3, 4, 5, and 16). Every rule is assigned a unique identifier (`BR-XXX`), categorized by functional domain, and defined with its triggers, preconditions, operational logic, error behaviors, and persistence enforcement mechanisms.

Under the core mandate **"NEVER GUESS"**, these rules represent confirmed startup specifications. Any parameter not yet finalized by the founder (such as the exact pilot free listing count) is explicitly bound to administrative configuration gates.

---

## 2. Rule Catalog Summary

| Rule ID        | Category         | Summary                                      | Enforcement Layer                         |
| :------------- | :--------------- | :------------------------------------------- | :---------------------------------------- |
| **BR-STU-001** | Student Account  | Mandatory Egyptian Phone & OTP Verification  | Application & SMS Gateway                 |
| **BR-STU-002** | Student Account  | Mandatory University Affiliation             | Application / Schema Constraint           |
| **BR-STU-003** | Student Account  | Verified Phone Number Migration              | Application / Transactional State         |
| **BR-PRV-001** | Provider Account | Mandatory Provider Role Categorization       | Application / DB Enum                     |
| **BR-PRV-002** | Provider KYC     | Verification Gate Prior to Publishing        | Authorization Guard / DB Status           |
| **BR-PRV-003** | Provider KYC     | Sensitive Document Storage Privacy           | Storage Service & API Serializer          |
| **BR-ADM-001** | Administration   | Single Seeded Superadmin Account             | DB Seed / CLI Script                      |
| **BR-ADM-002** | Administration   | Immutable Administrative Audit Logging       | Database Transaction / Interceptor        |
| **BR-ACC-001** | Accommodation    | Hierarchical Structural Modeling             | Relational Foreign Key Tree               |
| **BR-ACC-002** | Accommodation    | Autonomous Standalone Publishing             | Schema Polymorphism                       |
| **BR-PRC-001** | Pricing          | Provider Autonomy & Multi-Duration Pricing   | Validation Schema & DTO                   |
| **BR-PRC-002** | Pricing          | Itemized Mandatory & Optional Expenses       | Relational Child Entity                   |
| **BR-LST-001** | Listing Approval | Mandatory Admin Approval for New Listings    | Moderation State Machine                  |
| **BR-LST-002** | Listing Approval | Re-review Gate for Significant Listing Edits | Event Trigger / State Transition          |
| **BR-BKG-001** | Booking Request  | Maximum Three Open Booking Requests Limit    | Transactional Pre-check / 400 Bad Request |
| **BR-BKG-002** | Booking Request  | Maximum One Confirmed Booking Limit          | Transactional Pre-check / 409 Conflict    |
| **BR-BKG-003** | Booking Request  | Immediate Contact Details Transparency       | Event Listener / API DTO Response         |
| **BR-BKG-004** | Booking Request  | Unilateral Owner Decision Without Reason     | API Endpoint / State Machine              |
| **BR-BKG-005** | Booking Request  | Student Cancellation & Private Audit Log     | State Machine / Private Column            |
| **BR-AGR-001** | Mutual Agreement | Bilateral Confirmation In-App                | Atomic Transaction / Multi-key Sign       |
| **BR-AGR-002** | Mutual Agreement | Partial Availability State Enforcement       | Atomic DB Transaction & Locking           |
| **BR-AGR-003** | Mutual Agreement | Auto-closure of Conflicting Booking Requests | Cascading Transaction Update              |
| **BR-MSG-001** | Messaging        | Request-Linked Permanent 1:1 Conversation    | DB Entity & Decoupled State               |
| **BR-REV-001** | Reviews          | Post-Confirmed Booking Eligibility Gate      | Authorization Guard / Relational Join     |
| **BR-REV-002** | Reviews          | Single Review per Confirmed Booking          | Unique Database Constraint                |
| **BR-REV-003** | Reviews          | Single Public Provider Response Limit        | Unique Foreign Key Constraint             |
| **BR-REP-001** | Reports          | Text-Only Progressive Dispute Progression    | State Machine & Admin Dashboard           |
| **BR-REV-004** | Revenue          | Zero Commission on Rent in MVP               | Business Policy Gate                      |

---

## 3. Granular Business Rule Specifications

### 3.1 Student Account & Profile Domain

#### `BR-STU-001`: Mandatory Egyptian Phone & OTP Verification

- **Statement**: Every student registration requires a valid Egyptian mobile phone number (`+2010...`, `+2011...`, `+2012...`, `+2015...`) verified via a 6-digit One-Time Password (OTP).
- **Preconditions**: Phone number must not already be linked to an active user account.
- **Trigger**: Student initiates sign-up (`POST /api/v1/auth/student/register`).
- **Operational Logic**:
  1. Generate cryptographically secure 6-digit OTP with a 5-minute expiration time.
  2. Rate limit: Maximum 3 OTP requests per phone number within a 15-minute rolling window.
  3. User account created in `UNVERIFIED` state until correct OTP is provided.
- **Error Behavior**:
  - Invalid format: HTTP 422 Unprocessable Entity (`ERR_INVALID_PHONE_NUMBER`).
  - Rate limit exceeded: HTTP 429 Too Many Requests (`ERR_OTP_RATE_LIMIT_EXCEEDED`).
  - Expired or incorrect code: HTTP 400 Bad Request (`ERR_OTP_INVALID_OR_EXPIRED`).

#### `BR-STU-002`: Mandatory University Affiliation

- **Statement**: During registration, every student user must select their affiliated Egyptian university from the system's approved university directory.
- **Preconditions**: Target `university_id` must exist and be marked `is_active = true`.
- **Operational Logic**: Faculty / department selection is optional. University enrollment proof document upload is optional. Profile photo is optional.
- **Error Behavior**: Missing or invalid `university_id` returns HTTP 422 (`ERR_UNIVERSITY_REQUIRED`).

#### `BR-STU-003`: Verified Phone Number Migration

- **Statement**: A student user may change their registered phone number only after verifying the new phone number via SMS OTP.
- **Preconditions**: User must have an active authenticated session. The new phone number must not already be registered to another user.
- **Operational Logic**:
  1. Old phone number remains the primary contact until verification succeeds.
  2. SMS OTP is dispatched to the new phone number.
  3. Upon successful OTP submission, the user's `phone` column is updated, and existing sessions remain valid.
- **Error Behavior**: Attempting to update without OTP or providing an existing phone number returns HTTP 409 Conflict (`ERR_PHONE_ALREADY_REGISTERED`).

---

### 3.2 Property Provider & KYC Domain

#### `BR-PRV-001`: Mandatory Provider Role Categorization

- **Statement**: Every property provider must designate their legal classification during registration:
  1. `INDIVIDUAL_OWNER`: Direct property owner.
  2. `AUTHORIZED_AGENT`: Individual holding legal power of attorney to manage the property.
  3. `MANAGEMENT_COMPANY`: Registered corporate entity managing a student property portfolio.
- **Operational Logic**: Unauthorized brokers are strictly prohibited. The platform does not provide a public "Broker" registration pathway.

#### `BR-PRV-002`: Verification Gate Prior to Publishing

- **Statement**: A property provider cannot publish any property listings or make properties visible in public search until their account and verification documents have been reviewed and approved by an administrator (`verification_status = 'VERIFIED'`).
- **Preconditions**: Provider must submit required KYC documents based on their legal category:
  - _Individual Owner_: Valid Egyptian National ID card + Registered Property Ownership Deed / Contract (_Aqd Melkeya_).
  - _Authorized Agent_: Valid Egyptian National ID card + Official Notarized Power of Attorney from the Real Estate Publicity Dept (_Tawkeel Rasmi mn El-Shahr El-Aqary_).
  - _Management Company_: Commercial Registry (_Segell Togari_) + Tax Card (_Betaka Darebeya_) + Representative National ID.
- **Operational Logic**: When a provider attempts to publish a property while `verification_status != 'VERIFIED'`, the publication action is rejected.
- **Error Behavior**: HTTP 403 Forbidden (`ERR_PROVIDER_NOT_VERIFIED`).

#### `BR-PRV-003`: Sensitive Document Storage Privacy

- **Statement**: All KYC verification documents (National IDs, ownership contracts, powers of attorney) must be stored in secure, private, non-public storage.
- **Operational Logic**:
  - Verification documents are accessible solely to the uploading provider and authorized platform administrators via time-limited signed URLs.
  - Public property and provider API responses must serialize out and purge all verification URLs, document references, and National ID numbers.
- **System Invariant**: Verification documents must NEVER be visible to students or other providers.

---

### 3.3 Accommodation Hierarchy & Inventory Domain

#### `BR-ACC-001`: Hierarchical Structural Modeling

- **Statement**: Property inventory supports an optional 4-tier hierarchical accommodation tree:
  $$\text{Building} \longrightarrow \text{Unit (Apartment)} \longrightarrow \text{Room} \longrightarrow \text{Bed}$$
- **Operational Logic**:
  - A `Building` contains one or more `Units`.
  - A `Unit` contains one or more `Rooms` (plus common amenities: bathrooms, kitchen, living room).
  - A `Room` may be classified as `PRIVATE` (capacity = 1) or `SHARED` (capacity > 1).
  - A `SHARED` room contains discrete `Beds` (e.g., Bed 1, Bed 2).
- **System Invariant**: Deleting or archiving a parent entity cascades state changes to child entities safely according to database foreign key rules.

#### `BR-ACC-002`: Autonomous Standalone Publishing

- **Statement**: Property providers are not forced into rigid structures. A provider may list:
  1. An entire building.
  2. A standalone apartment/unit (without defining a parent building).
  3. A private room within an apartment.
  4. An individual bed within a shared room.
- **Operational Logic**: Each accommodation entity maintains an independent `is_published` and `availability_status` flag.

---

### 3.4 Pricing, Expenses & Listing Approval Domain

#### `BR-PRC-001`: Provider Autonomy & Multi-Duration Pricing

- **Statement**: The property provider has complete autonomy to set prices in Egyptian Pounds (EGP).
- **Operational Logic**:
  - Pricing Unit options: `PER_PERSON`, `PER_BED`, `PER_ROOM`, `PER_UNIT`.
  - Duration Unit options: `DAILY`, `WEEKLY`, `MONTHLY`, `SEMESTER`, `YEARLY`.
  - The listing must clearly identify both the pricing unit and duration unit.
- **Error Behavior**: Zero or negative pricing amounts return HTTP 422 (`ERR_INVALID_PRICE_AMOUNT`).

#### `BR-PRC-002`: Itemized Mandatory & Optional Expenses

- **Statement**: All utility, maintenance, and administrative fees outside base rent must be declared as itemized additional expenses.
- **Operational Logic**:
  - Each expense must define:
    - `name_ar` and `name_en` (e.g., Electricity, Water, Wi-Fi, Security, Cleaning).
    - `amount` (in EGP).
    - `is_mandatory` (Boolean: true = required, false = optional service).
    - `is_recurring` (Boolean: true = recurring per billing cycle, false = one-time deposit/fee).
- **System Invariant**: Hidden or surprise charges at checkout are prohibited; all expenses are rendered transparently on the property details page.

#### `BR-LST-001`: Mandatory Admin Approval for New Listings

- **Statement**: Every new property listing created by a verified provider is placed in `PENDING_REVIEW` status and cannot appear in search results until an administrator approves it.
- **Operational Logic**: Superadmin inspects listing data, photos, address, and amenities. Admin actions:
  - `APPROVE` -> Status transitions to `PUBLISHED` (visible in search).
  - `REJECT` -> Status transitions to `REJECTED` (with moderation note sent to provider).

#### `BR-LST-002`: Re-review Gate for Significant Listing Edits

- **Statement**: Significant edits to an active listing (e.g., modifying address, geographic coordinates, accommodation hierarchy, or primary capacity) automatically reset the listing status from `PUBLISHED` to `PENDING_REVIEW`.
- **Operational Logic**: Minor textual typo fixes or photo reordering do not trigger re-review. Address, location, and structural capacity modifications trigger immediate unpublishing pending admin re-approval.

---

### 3.5 Booking Request & Agreement Domain

#### `BR-BKG-001`: Maximum Three Open Booking Requests Limit

- **Statement**: A student user may hold at most **three (3) open booking requests** simultaneously across the platform.
- **Definition of "Open Request"**: Any booking request where `status IN ('PENDING', 'ACCEPTED')`.
- **Preconditions**: Evaluated atomically before inserting a new booking request record.
- **Operational Logic**:
  $$\text{Count}(\text{open\_requests}) = \sum \mathbb{I}(\text{student\_id} = s \land \text{status} \in \{\text{'PENDING'}, \text{'ACCEPTED'}\})$$
  $$\text{If } \text{Count}(\text{open\_requests}) \ge 3 \implies \text{REJECT}$$
- **Error Behavior**: HTTP 400 Bad Request with localized message:
  - Arabic: _"لا يمكن فتح أكثر من 3 طلبات حجز في وقت واحد"_
  - Error Code: `ERR_MAX_OPEN_REQUESTS_REACHED`.

#### `BR-BKG-002`: Maximum One Active Confirmed Booking Limit

- **Statement**: A student cannot have more than **one (1) active confirmed booking** across the platform.
- **Definition of "Active Confirmed Booking"**: A booking where `status = 'CONFIRMED'`.
- **Preconditions**: Evaluated when confirming an agreement.
- **Operational Logic**: If student $s$ already holds an agreement with status `CONFIRMED`, any attempt to confirm another agreement is rejected.
- **Error Behavior**: HTTP 409 Conflict (`ERR_STUDENT_HAS_CONFIRMED_BOOKING`).

#### `BR-BKG-003`: Immediate Contact Details Transparency

- **Statement**: Immediately upon the creation of a booking request, the system reveals the full contact details between the student and the property provider:
  1. Student receives: Provider Full Name, Egyptian Mobile Phone, Email Address.
  2. Provider receives: Student Full Name, Egyptian Mobile Phone, Email Address, University Name.
- **System Invariant**: Contact details disclosure is unconditional upon request creation; however, private KYC documents (National ID, property deeds) are strictly excluded from this disclosure.

#### `BR-BKG-004`: Unilateral Owner Decision Without Reason

- **Statement**: A property provider may accept or reject any incoming booking request. Rejection does not require any mandatory justification or explanation.
- **Operational Logic**:
  - If provider accepts: Request status transitions from `PENDING` to `ACCEPTED`.
  - If provider rejects: Request status transitions from `PENDING` to `REJECTED`. Rejection reason is strictly optional.

#### `BR-BKG-005`: Student Cancellation & Private Audit Log

- **Statement**: A student may cancel an unconfirmed booking request (`status IN ('PENDING', 'ACCEPTED')`) at any time.
- **Operational Logic**:
  - Request status transitions to `CANCELLED`.
  - Provider receives an immediate in-app notification.
  - The cancellation is recorded in internal audit metrics for anti-abuse tracking.
  - The cancellation history is **never** displayed on the student’s public profile.

#### `BR-AGR-001`: Bilateral Mutual Agreement Confirmation

- **Statement**: A booking request is only finalized when both parties explicitly approve the agreement inside the platform.
- **Operational Logic**:
  - State machine tracks `student_confirmed = true` and `provider_confirmed = true`.
  - An optional PDF/image agreement contract document may be attached.
  - When both flags evaluate to `true`, the agreement transitions to `CONFIRMED`.
  - Concurrency control: Handled using PostgreSQL transactional row locks (`SELECT ... FOR UPDATE`) on the target accommodation portion.

#### `BR-AGR-002`: Partial Availability State Enforcement

- **Statement**: When a booking agreement is confirmed for an accommodation portion, **only the specific booked portion** is marked unavailable (`availability_status = 'BOOKED'`).
- **Operational Logic**:
  - If Bed #2 in Room A (inside 3-bedroom Unit 10) is confirmed:
    - Bed #2 $\to$ `BOOKED`.
    - Room A $\to$ Remains `AVAILABLE` (with remaining capacity decremented).
    - Other Rooms $\to$ Remain `AVAILABLE`.
    - Unit 10 $\to$ Remains `AVAILABLE`.
    - Parent Building $\to$ Remains `AVAILABLE`.
- **System Invariant**: Never mark an entire apartment or building unavailable when only a subordinate room or bed is booked.

#### `BR-AGR-003`: Auto-closure of Conflicting Booking Requests

- **Statement**: Upon mutual confirmation of an agreement for an accommodation portion, all other pending/accepted booking requests targeting that same portion are automatically closed.
- **Operational Logic**:
  - Competing requests transition to status `CLOSED_CONFLICT`.
  - Affected students receive a system notification: _"نأسف، تم حجز هذا السكن بواسطة طالب آخر"_ (Sorry, this accommodation has been booked by another student).

---

### 3.6 Messaging & Communications Domain

#### `BR-MSG-001`: Request-Linked Permanent 1:1 Conversation

- **Statement**: A 1:1 text-only conversation is created automatically and permanently bound to every booking request.
- **Operational Logic**:
  - Conversation status is decoupled from booking request status.
  - If the booking request is canceled or rejected, the conversation **remains open permanently**.
  - Both parties can continue sending text messages and are permitted to share external contact information, social links, or phone numbers.
  - Non-participants are barred with HTTP 403 Forbidden.

---

### 3.7 Reviews, Reports & Administration Domain

#### `BR-REV-001`: Post-Confirmed Booking Eligibility Gate

- **Statement**: Reviews (1–5 stars + text comment) can only be submitted if the booking reached `CONFIRMED` status.
- **Operational Logic**: Viewing appointments, rejected requests, and canceled requests are ineligible for review submission. Attempting to submit a review without a confirmed booking returns HTTP 403 Forbidden (`ERR_REVIEW_INELIGIBLE_NO_CONFIRMED_BOOKING`).

#### `BR-REV-002`: Single Review per Confirmed Booking

- **Statement**: Exactly one review may be submitted per confirmed booking by each participating party (Student reviews Property/Owner; Owner reviews Student).
- **Error Behavior**: Second submission attempt returns HTTP 409 Conflict (`ERR_DUPLICATE_REVIEW`).

#### `BR-REV-003`: Single Public Provider Response Limit

- **Statement**: The recipient of a review has the right to submit exactly **one (1)** public response.
- **Operational Logic**: Response is anchored to the parent review. Attempting to post a second response returns HTTP 409 Conflict (`ERR_REVIEW_RESPONSE_ALREADY_EXISTS`).

#### `BR-REP-001`: Text-Only Progressive Dispute Progression

- **Statement**: Students and providers may submit text-only reports regarding fraud, misleading listings, harassment, or violations.
- **Operational Logic**: Reports advance through four states: `NEW` $\to$ `UNDER_REVIEW` $\to$ `RESPONDED` $\to$ `CLOSED`. Admins investigate and record resolution notes.

#### `BR-ADM-001`: Single Seeded Superadmin Account

- **Statement**: Exactly one initial superadministrator account is created via database seed/CLI during setup. There is zero public registration endpoint for administrator accounts.

#### `BR-ADM-002`: Immutable Administrative Audit Logging

- **Statement**: Every administrative operation (approving/rejecting KYC, approving/rejecting listings, banning accounts, resolving disputes, modifying platform settings) must be synchronously written to `AdminActionLog` with admin ID, timestamp, entity type, entity ID, and JSON change diff.

#### `BR-REV-004`: Zero Commission on Rent in MVP

- **Statement**: The platform does not charge rental commissions to students or property owners in the MVP release. Property providers receive a free listing allowance during the pilot launch (threshold configured via platform settings).

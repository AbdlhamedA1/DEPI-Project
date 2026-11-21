# End-to-End User Journeys & Workflow Specifications

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Overview & Architecture of User Flows

This document details the complete end-to-end user journeys for the three core platform user types:

1. **Student User Journey** (Discovery $\to$ Search $\to$ Details $\to$ Booking Request $\to$ Chat & Negotiation $\to$ Mutual Confirmation $\to$ Post-Booking Review)
2. **Property Provider Journey** (Registration $\to$ KYC Verification $\to$ Hierarchical Listing Creation $\to$ Request Management $\to$ Mutual Confirmation $\to$ Review Response)
3. **Administrator Journey** (KYC Review $\to$ Listing Moderation $\to$ Dispute & Report Resolution $\to$ Platform Configuration & Audit Monitoring)

Each journey is specified with:

- **Prerequisites & Entry Conditions**
- **Step-by-Step Happy Path Flow**
- **System State & Data Transitions**
- **Edge Cases & Failure Recovery Flows**

---

## 2. Student User Journey

### 2.1 Overview Diagram

```
[Landing Page]
      │
      ▼
[Search & Discovery] ──(Filter: University, City, Budget, Distance)──► [Listing Cards / Map Pins]
      │
      ▼
[Property Details Page] ──(Review Pricing, Unit/Room/Bed, Amenities)
      │
      ▼
[Submit Booking Request] ◄── [Check: Active Open Requests < 3]
      │
      ├── Immediate Contact Exchange (Name, Phone, Email Revealed)
      ├── 1:1 Request Chat Created
      ▼
[In-App Chat & Independent Viewing Negotiation]
      │
      ├── Owner Accepts Request
      ▼
[Mutual Agreement Confirmation] ◄── [Check: Student Has No Confirmed Booking]
      │
      ├── Both Parties Confirm In-App (Optional Lease Upload)
      ├── Target Accommodation Portion Marked 'BOOKED'
      ├── Competing Requests Auto-Closed
      ▼
[Post-Booking Experience & Review Submission]
```

### 2.2 Step-by-Step Happy Path

#### Step S1: Discovery & Filtered Search

1. **Entry**: Student lands on the platform public portal (`/[locale]`), localized in Egyptian Arabic RTL (or English LTR).
2. **Search Input**: Student selects target University (e.g., Cairo University), City (Giza), Area (Dokki / Bein El-Sarayat), Budget Range (e.g., 1,500 – 3,000 EGP), and Accommodation Type (e.g., Private Room or Bed in Shared Flat).
3. **Results View**: Student toggles between interactive Google Maps view (showing exact proximity pins relative to Cairo University main campus) and responsive property cards.
4. **Transparent Ranking**: Results are sorted objectively by suitability: proximity to main campus and budget match without sponsored bias.

#### Step S2: Exploring Accommodation Details

1. **Navigation**: Student clicks on an approved listing (`/properties/[propertyId]`).
2. **Information Display**: Student reviews organized expandable sections:
   - High-resolution Cloudinary property photos with cover badge.
   - Exact address and campus distance calculation (e.g., "1.2 km from Cairo University Main Gate").
   - Transparent pricing: Base rent per month (EGP) + Itemized additional expenses (e.g., mandatory electricity deposit, optional Wi-Fi).
   - Accommodation hierarchy: Breakdown of available units, rooms, and individual beds with current availability indicators.
   - House rules and gender restrictions (e.g., Female-only / _Lil-Banat Faqat_).
   - Provider badge showing verified status.

#### Step S3: Registration & Authentication

1. **Trigger**: Student decides to submit a booking request and is prompted to sign in or register (`/register`).
2. **Input**: Student provides Name, Email, Egyptian Mobile Phone (`+2010...`), and selects their University.
3. **OTP Verification**: System dispatches a 6-digit SMS OTP. Student inputs the code within 5 minutes.
4. **Session**: JWT access and refresh tokens are issued; student profile record is initialized with university association.

#### Step S4: Submitting a Booking Request

1. **Action**: On the property details page, student selects specific Bed #2 in Room A (inside Unit 3), types an optional introductory note, and clicks **"Submit Booking Request"**.
2. **System Guard (`BR-BKG-001`)**: Backend verifies the student currently holds fewer than 3 open booking requests (`status IN ('PENDING', 'ACCEPTED')`).
3. **Execution**:
   - Booking request record created (`status = 'PENDING'`).
   - Contact Disclosure: Name, phone number, and email of both parties are immediately made visible on the request page (`BR-BKG-003`).
   - Dedicated 1:1 conversation created and linked to the request (`BR-MSG-001`).
   - In-app notification dispatched to the property provider.

#### Step S5: Communication & Independent Viewing

1. **In-App Messaging**: Student and provider message each other via the request chat to discuss move-in dates, house rules, and arrange an in-person viewing.
2. **External Coordination**: Utilizing disclosed phone numbers, parties may speak directly or message on WhatsApp.
3. **Provider Acceptance**: Provider clicks **"Accept Request"** (`status = 'ACCEPTED'`). Both parties coordinate the viewing independently.

#### Step S6: Mutual Agreement Confirmation

1. **Confirmation Action**: Following the viewing and agreement on tenancy terms, the provider clicks **"Confirm Agreement"** in-app.
2. **Student Confirmation**: Student receives an alert and reviews the agreement summary (target bed, monthly EGP price, move-in date). Student clicks **"Confirm Agreement"**.
3. **System Execution (`BR-AGR-001`, `BR-AGR-002`, `BR-AGR-003`)**:
   - Concurrency check verifies student has no other active confirmed booking (`BR-BKG-002`).
   - Target Bed #2 status set to `BOOKED` within a database transaction utilizing row-level locking.
   - Parent Room A remains `AVAILABLE` with capacity decremented; parent Unit 3 remains `AVAILABLE`.
   - All other pending requests from competing students targeting Bed #2 transition to `CLOSED_CONFLICT`.
   - Agreement status transitions to `CONFIRMED`.

#### Step S7: Post-Confirmation Review Submission

1. **Eligibility Check (`BR-REV-001`)**: Once the booking reaches `CONFIRMED` status, the review submission form unlocks on the student's booking dashboard.
2. **Submission**: Student submits a rating (1 to 5 stars) and an optional written review evaluating property cleanliness, amenities accuracy, and provider communication.
3. **Publication**: Review is published publicly on the property profile; provider is notified and granted the right to submit one public response.

---

### 2.3 Student Journey Edge Cases & Handling

| Scenario / Edge Case                            | Trigger / Condition                                                                                              | System Behavior & Technical Resolution                                                                                                                                                                                                                     |
| :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Attempting 4th Open Booking Request**         | Student currently has 3 requests in `PENDING` or `ACCEPTED` status and attempts to submit a 4th request.         | Request rejected with HTTP 400 Bad Request (`ERR_MAX_OPEN_REQUESTS_REACHED`). Localized error modal informs student: _"لقد بلغت الحد الأقصى لطلبات الحجز المفتوحة (3 طلبات). يرجى إلغاء أحد الطلبات الحالية لتتمكن من تقديم طلب جديد."_                    |
| **Attempting 2nd Confirmed Booking**            | Student already holds an active `CONFIRMED` booking and attempts to confirm an agreement on another property.    | Mutual confirmation action blocked with HTTP 409 Conflict (`ERR_STUDENT_HAS_CONFIRMED_BOOKING`). Student is prompted that they can only hold one active confirmed booking at a time.                                                                       |
| **Student Cancels Request**                     | Student decides to cancel an unconfirmed booking request (`PENDING` or `ACCEPTED`).                              | Request transitions to `CANCELLED`. Provider receives real-time notification. Slot in the student's 3-request quota is immediately freed. Internal cancellation counter incremented; public profile unaffected (`BR-BKG-005`).                             |
| **Provider Rejects Request**                    | Provider rejects student request.                                                                                | Request transitions to `REJECTED`. Provider is not required to provide a reason. Student is notified. The 1:1 conversation thread **remains permanently open** for further clarification if desired (`BR-MSG-001`). Student's open request quota is freed. |
| **Attempting Review Without Confirmed Booking** | Student attempts to submit a review for a property where their request was canceled, rejected, or merely viewed. | Review submission blocked with HTTP 403 Forbidden (`ERR_REVIEW_INELIGIBLE_NO_CONFIRMED_BOOKING`). Reviews are strictly restricted to confirmed bookings (`BR-REV-001`).                                                                                    |

---

## 3. Property Provider User Journey

### 3.1 Overview Diagram

```
[Provider Registration] ──(Select: Owner, Agent, or Management Co.)
      │
      ▼
[KYC Document Submission] ──(Upload: National ID + Ownership Deed / Power of Attorney)
      │
      ▼
[Admin Review Queue] ──(Approved by Superadmin)──► [Provider Status: VERIFIED]
      │
      ▼
[Hierarchical Listing Creation] ──(Building -> Units -> Rooms -> Beds + Pricing + Photos)
      │
      ▼
[Listing Moderation Queue] ──(Approved by Superadmin)──► [Listing Status: PUBLISHED]
      │
      ▼
[Incoming Booking Request] ──(Review Student Profile & Mutual Contact Details)
      │
      ├── Accept Request ──► [In-App Chat & Independent Viewing]
      │
      ▼
[Confirm Agreement In-App] ──► [Target Bed/Room Marked BOOKED]
      │
      ▼
[Review Response Management] ──(Submit Single Official Response to Review)
```

### 3.2 Step-by-Step Happy Path

#### Step P1: Account Creation & Classification

1. **Registration**: Provider navigates to `/register`, selects account type "Property Owner / Manager", and provides Name, Email, Egyptian Mobile Phone, and designates classification:
   - `INDIVIDUAL_OWNER`
   - `AUTHORIZED_AGENT`
   - `MANAGEMENT_COMPANY`
2. **Account Initialization**: Provider verifies phone via SMS OTP. Account created in `ACTIVE` state with `verification_status = 'UNVERIFIED'`.

#### Step P2: KYC Document Submission

1. **Verification Form**: Provider accesses `/owner/verification` and uploads required documents based on their classification:
   - _Individual Owner_: High-resolution photo/scan of valid Egyptian National ID (front & back) + Property Ownership Contract / Deed (_Aqd Melkeya_).
   - _Authorized Agent_: National ID + Official Notarized Power of Attorney (_Tawkeel Rasmi_).
   - _Management Company_: Commercial Registry (_Segell Togari_) + Tax Card (_Betaka Darebeya_) + Representative ID.
2. **Secure Upload**: Documents uploaded directly to private, non-public cloud storage (`BR-PRV-003`). Verification ticket transitions to `PENDING_REVIEW`.

#### Step P3: Administrative Approval

1. Superadmin inspects documents in the admin KYC queue, verifies authenticity, and clicks **"Approve"**.
2. Provider’s account status updates to `verification_status = 'VERIFIED'`. Provider receives an in-app notification confirming publishing privileges.

#### Step P4: Hierarchical Property Creation & Listing

1. **Property Creation Wizard**: Provider navigates to `/owner/properties/new`.
2. **Location**: Enters city, area, street address, and drops a pin on Google Maps to capture exact latitude and longitude.
3. **Structure Modeling**:
   - Provider creates an apartment (Unit 2, 2nd floor, 2 bathrooms, kitchen).
   - Adds Room 1 (Private Room, 1 tenant capacity) and Room 2 (Shared Room, 2 bed capacity: Bed 1 and Bed 2).
4. **Pricing & Itemized Expenses**:
   - Room 1: 3,200 EGP / Monthly.
   - Room 2, Bed 1: 1,800 EGP / Monthly.
   - Room 2, Bed 2: 1,800 EGP / Monthly.
   - Additional Expenses: Water (50 EGP/month, mandatory, recurring), Electricity (per meter consumption, mandatory, recurring), Wi-Fi (100 EGP/month, optional).
5. **Media Upload**: Uploads 8 property photos via Cloudinary; selects the primary living room photo as the cover image.
6. **Submission**: Provider submits listing. Status enters `PENDING_REVIEW` pending admin ad moderation (`BR-LST-001`).

#### Step P5: Handling Inquiries & Confirming Agreements

1. **Request Received**: Provider receives an alert for a booking request targeting Room 2, Bed 2 from student Ahmed Mostafa.
2. **Review & Contact**: Provider views Ahmed’s profile, university, and immediately sees his mobile number and email.
3. **Acceptance & Chat**: Provider clicks "Accept", opening the dedicated chat thread to schedule an in-person viewing on Tuesday at 4:00 PM.
4. **Mutual Confirmation**: Following a successful viewing, provider navigates to the request dashboard and clicks "Confirm Agreement". Once Ahmed confirms on his end, Bed 2 is locked and marked `BOOKED`.

#### Step P6: Managing Feedback

1. **Review Notification**: After tenancy commencement, student submits a 4-star review with feedback regarding water pressure.
2. **Single Response (`BR-REV-003`)**: Provider accesses `/owner/reviews`, types a professional response explaining that a water booster pump has been installed, and submits. The response is displayed publicly beneath the student review.

---

### 3.3 Provider Journey Edge Cases & Handling

| Scenario / Edge Case                              | Trigger / Condition                                                                                              | System Behavior & Technical Resolution                                                                                                                                                                                                       |
| :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Attempting to Publish Before KYC Approval**     | Unverified provider attempts to publish a property or make a draft listing active.                               | Action blocked with HTTP 403 Forbidden (`ERR_PROVIDER_NOT_VERIFIED`). System displays prompt to submit KYC verification documents before publishing.                                                                                         |
| **Provider Modifies Critical Listing Parameters** | Verified provider edits address, floor plan, or accommodation type of an active listing.                         | Listing status immediately transitions from `PUBLISHED` back to `PENDING_REVIEW` (`BR-LST-002`). Listing temporarily hidden from public search until superadmin re-reviews and re-approves.                                                  |
| **Simultaneous Competing Requests for Same Bed**  | Two students (Student A and Student B) have open requests for Bed 1. Provider confirms agreement with Student A. | Upon Student A & Provider mutual confirmation: Bed 1 status set to `BOOKED`. Student B's pending request automatically transitions to `CLOSED_CONFLICT` (`BR-AGR-003`). Student B receives notification that the bed is no longer available. |
| **Attempting Multiple Review Responses**          | Provider attempts to post a second response to a student review.                                                 | Action blocked with HTTP 409 Conflict (`ERR_REVIEW_RESPONSE_ALREADY_EXISTS`). Only one response is permitted per review (`BR-REV-003`).                                                                                                      |

---

## 4. Platform Administrator User Journey

### 4.1 Overview Diagram

```
[Admin Authentication] ──(Seeded Superadmin Credentials)
      │
      ├── KYC Moderation Queue ──► [Inspect ID & Title Deed] ──► [Approve / Reject]
      │
      ├── Listing Moderation Queue ──► [Inspect Photos, Address, Pricing] ──► [Approve / Reject]
      │
      ├── Dispute & Report Center ──► [Investigate Text Report] ──► [Resolve / Ban]
      │
      ├── Platform Settings & Directory ──► [Manage Cities, Universities, Pilot Caps]
      │
      └── Immutable Audit Log ──► [Inspect AdminActionLog diffs & timestamps]
```

### 4.2 Step-by-Step Happy Path

#### Step A1: Secure Superadmin Sign-In

1. **Access**: Admin accesses `/admin/login` using seeded administrator credentials.
2. **Privilege**: System issues admin session with full RBAC scope; all write actions bind to `AdminActionLog`.

#### Step A2: Moderating Provider KYC Submissions

1. **Queue Inspection**: Admin navigates to `/admin/verifications`. Filters for `PENDING` submissions.
2. **Document Audit**: Admin opens provider ticket:
   - Views provider name, national ID number, and provider type (`INDIVIDUAL_OWNER`).
   - Generates temporary signed URLs to inspect the National ID scan and registered ownership deed.
3. **Decision**:
   - If authentic: Clicks **"Approve"**. System sets provider status to `VERIFIED`. An audit entry is recorded in `AdminActionLog`. Provider is notified.
   - If invalid/suspicious: Clicks **"Reject"**, inputs mandatory rejection note (e.g., _"عقد الملكية غير واضح أو منتهي الصلاحية"_ / Ownership contract unclear or expired). Provider status set to `REJECTED`.

#### Step A3: Moderating Property Advertisements

1. **Queue Inspection**: Admin navigates to `/admin/properties`. Filters for listings in `PENDING_REVIEW`.
2. **Listing Audit**: Admin verifies:
   - Photos contain no watermarks, nudity, or off-platform broker contact info.
   - Address and Google Maps coordinates are coherent.
   - Pricing in EGP is realistic and itemized expenses are clearly defined.
3. **Decision**:
   - Clicks **"Approve Listing"**. Listing status transitions to `PUBLISHED` and becomes searchable in public index.
   - Clicks **"Reject Listing"** with reason if listing violates quality standards.

#### Step A4: Investigating Disputes & User Reports

1. **Report Queue**: Admin navigates to `/admin/reports`. Views new reports (`status = 'NEW'`).
2. **Investigation**: Inspects a complaint submitted by a student regarding a misleading property listing:
   - Reviews complaint text and referenced property ID.
   - Updates report status to `UNDER_REVIEW`.
   - Inspects property details and messaging logs if necessary for fraud detection.
3. **Resolution**:
   - Admin takes disciplinary action: unpublishes fraudulent listing and suspends offending provider.
   - Updates report status to `CLOSED` with resolution summary: _"تم حظر العقار المخالف وإنذار المالك"_ (Violating property delisted and owner warned).

#### Step A5: Analytics & Configuration Monitoring

1. **Analytics Inspection**: Admin navigates to `/admin/analytics` to monitor:
   - Total registered students vs. verified providers.
   - Active listings across Egyptian governorates (Cairo, Giza, Alexandria).
   - Average rental price per bed/room across university zones.
   - Booking conversion velocity (time from request submission to confirmation).
2. **Configuration Management**: Admin updates pilot parameters in `/admin/settings` (e.g., toggling active pilot cities or modifying free listing thresholds).

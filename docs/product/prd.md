# Product Requirements Document (PRD)

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Document Control & Metadata

| Attribute                 | Specification                                            |
| :------------------------ | :------------------------------------------------------- |
| **Document Version**      | 1.0.0-PROD-SPEC                                          |
| **Document Status**       | Approved for Foundation Implementation                   |
| **Product Tier**          | Minimum Viable Product (MVP) Pilot                       |
| **Primary Target Market** | Arab Republic of Egypt                                   |
| **Source Authority**      | `app.txt` (Sections 3, 4, 5, 16) & `app2.txt`            |
| **Languages Supported**   | Arabic (Egyptian RTL, Primary), English (LTR, Secondary) |

---

## 2. Product Overview & Strategic Objectives

The Egyptian Student Housing Platform is an intermediary technology marketplace connecting Egyptian university students with verified property owners and legally authorized property managers. The platform is not a real estate agency or a property management firm: it does not collect rent, take broker commissions, or oversee tenancies.

### 2.1 Core Strategic Objectives

1. **Trust & Verification**: Eliminate rental fraud, bait-and-switch advertising, and unverified brokers by enforcing rigorous KYC (National ID and title/authorization deed verification) for all property providers prior to listing publication.
2. **Operational Efficiency**: Provide students with an intuitive, bilingual search experience combining map-based spatial discovery, campus proximity metrics, and transparent EGP pricing.
3. **Structured Transactions**: Transform casual social media inquiries into formal booking requests governed by platform integrity rules (3 open requests maximum, 1 active confirmed booking maximum).
4. **Direct Transparency**: Automatically disclose direct contact details (Name, Egyptian Phone Number, Email) upon booking request creation to facilitate independent viewings and negotiations.
5. **Mutual Accountability**: Provide a platform-recorded mutual confirmation workflow, partial availability tracking, and post-booking reviews with owner response capabilities.

---

## 3. Market Definition & User Personas

### 3.1 Market Definition

- **Geographic Scope**: Nationwide Egyptian platform architecture with a gradual commercial launch starting in an initial pilot market (targeted university cluster in Greater Cairo or 6th of October City).
- **Target Universities**: Egyptian public universities, private institutions, national (_Ahleya_) universities, and accredited higher institutes.
- **Accommodation Archetypes**: Entire residential buildings, standalone apartments, private rooms within apartments, shared rooms, and individual beds within shared rooms.

### 3.2 User Personas

#### Persona A: Relocating Undergraduate Student

- **Name**: Ahmed Mostafa
- **Demographics**: 20 years old, 2nd-year Mechanical Engineering student at Cairo University, originally from Mansoura (Dakahlia Governorate).
- **Behavior & Goals**: Needs budget-friendly accommodation (bed in a shared room or private room in a shared apartment) within 20 minutes of Cairo University main campus.
- **Pain Points**: Harassed by street brokers demanding 1,500 EGP cash commission for substandard flats; terrified of losing deposits to unverified landlords.
- **Platform Usage**: Registers with Egyptian mobile number (+20), selects Cairo University, filters by budget (< 2,500 EGP/month) and distance (< 3 km), submits 2 booking requests, chats directly with verified owners, inspects property, and mutually confirms booking in-app.

#### Persona B: Female Medical Student Requiring Private Accommodation

- **Name**: Mariam El-Sayed
- **Demographics**: 22 years old, 4th-year Medicine student at Ain Shams University, relocating from Tanta.
- **Behavior & Goals**: Seeks a quiet, safe, female-only apartment or private room with verified building security, clear curfew/guest policies, and predictable utility bills.
- **Pain Points**: Misleading listings that fail to specify gender restrictions or hide electricity and water surcharges.
- **Platform Usage**: Filters for female-only (_banat_ / بنات) units, reviews itemized mandatory and optional expenses, uses in-app chat to clarify building rules, and confirms agreement securely.

#### Persona C: Individual Property Owner

- **Name**: Hajj Mahmoud Abdel-Rahim
- **Demographics**: 58 years old, owns a 4-story residential property in Dokki/Giza consisting of 8 student apartments.
- **Behavior & Goals**: Wants reliable, respectful university students; seeks to eliminate vacancy downtime without paying informal brokers.
- **Pain Points**: Flaky applicants who waste time; difficulty tracking which individual beds are booked vs. vacant across multiple rooms.
- **Platform Usage**: Registers as an Individual Owner, uploads Egyptian National ID card and property deed for admin verification, lists his building with apartment/room/bed breakdown, reviews student profiles, accepts booking requests, and confirms agreements.

#### Persona D: Authorized Property Management Company

- **Name**: Delta Student Housing Co. (Represented by Eng. Tarek)
- **Demographics**: Professional company managing 30+ leased student apartments across 6th of October City near MUST and October 6 University.
- **Behavior & Goals**: Requires structured portfolio management, multi-property publishing, and formal confirmation trails.
- **Platform Usage**: Registers as a Management Company, uploads commercial registry (_Segell Togari_) and tax card (_Betaka Darebeya_), creates multiple unit listings with detailed pricing models, and manages student communications.

#### Persona E: Platform Superadministrator

- **Name**: System Operations Lead
- **Role**: Seeded superadmin responsible for platform integrity.
- **Capabilities**: Reviews and approves/rejects provider KYC documents, moderates new and modified property advertisements, reviews reports and complaints, inspects immutable audit logs, and monitors market supply/demand analytics.

---

## 4. High-Level Feature Specifications

### 4.1 Authentication & Profile Management

- **Student Onboarding**: Registration via Egyptian mobile phone number with mandatory SMS OTP verification. University association is mandatory; faculty/major and enrollment proof are optional. Name and email captured. Phone updates require OTP verification on the new number.
- **Provider Onboarding**: Categorized registration (Individual Owner, Authorized Agent, Property Management Company). Profile capturing business name and tax ID where applicable.
- **Provider KYC Gate**: Providers cannot publish listings until identity (National ID) and property authority (title deed / official power of attorney / commercial registry) are validated and approved by an administrator.
- **Superadmin Account**: Manually seeded during system setup with zero public registration interface.

### 4.2 Property Inventory & Hierarchical Modeling

- **Flexible Structural Hierarchy**:
  - `Building`: Optional top-level container for multi-unit student properties.
  - `Unit`: Complete apartment, flat, or residential suite.
  - `Room`: Private room (single occupancy) or shared room (multi-occupancy).
  - `Bed`: Specific bed within a shared room.
- **Independent Publishing**: Providers can publish a standalone apartment directly without creating a parent building, or publish specific rooms/beds within a unit.
- **Multi-Duration EGP Pricing**: Pricing configured per person, per bed, per room, or per complete unit across Daily, Weekly, Monthly, Semester, or Yearly durations.
- **Itemized Expenses**: Mandatory vs. optional, one-time vs. recurring charges (e.g., electricity, water, internet, security, cleaning) listed explicitly.
- **Image Upload & Optimization**: Cloudinary integration for property image hosting with cover photo designation and responsive formats.
- **Listing Approval Gate**: New listings and significant modifications to active listings (address, capacity, accommodation type) require administrative approval before appearing in public search.

### 4.3 Search, Discovery & Spatial Mapping

- **Search Filters**: City, Area / Neighborhood, Target University, Distance from University Main Campus (in km), Budget range (min/max EGP), Accommodation Type (Unit, Private Room, Bed), Duration.
- **Spatial Proximity**: Powered by Google Maps API. Calculates direct distance between property geocoordinates and the university's main campus coordinates.
- **Dual View Layout**: Seamless switching between property card view and interactive Google Maps pin view.
- **Transparent Suitability Ordering**: Results sorted objectively based on proximity to campus and user-selected budget, without paid ranking bias.

### 4.4 Booking Request Lifecycle & Constraints

- **Request Submission**: Student selects a specific accommodation portion (unit, room, or bed) and submits a booking request with optional introductory notes.
- **Strict Concurrency Limits**:
  - Maximum of **3 open booking requests** per student across the entire platform.
  - Maximum of **1 active confirmed booking** per student.
- **Provider Decision**: Provider reviews request and either accepts or rejects it. Rejection does not require mandatory justification.
- **Student Cancellation**: Student can cancel an unconfirmed booking request at any time; provider receives immediate notification.
- **Internal Cancellation History**: The platform maintains an internal audit log of cancellations for anti-fraud monitoring; cancellation history is never displayed on the student’s public profile.

### 4.5 Immediate Contact Transparency & Messaging

- **Instant Contact Disclosure**: Upon booking request creation, the system immediately reveals the Name, Phone Number, and Email of both student and provider.
- **Dedicated Request Conversation**: A 1:1 text-only conversation is created automatically and linked to the booking request.
- **Permanent Thread Decoupling**: Conversations remain permanently accessible and active even if the booking request is subsequently rejected or canceled. Both parties may communicate and share external contact info freely.
- **Unread Indicators**: Real-time unread message counts for both parties.

### 4.6 Mutual Agreement Confirmation & Partial Availability

- **Mutual Approval**: Both student and provider must confirm the agreement in-app to finalize the transaction.
- **Optional Agreement Document**: Parties can upload an optional scanned agreement or tenancy lease contract.
- **Partial Availability Engine**: When an agreement is confirmed, the system marks **only the booked portion** (e.g., Bed #2 in Room A) as unavailable. Other beds in Room A and other units in the building remain fully available for public search and booking.
- **Auto-Closure of Competing Requests**: All other pending booking requests for the newly booked portion are automatically transitioned to `closed` with system notifications sent to affected applicants.
- **Database Row Locking**: Agreement confirmation transactions execute under PostgreSQL `SELECT ... FOR UPDATE` row locks to prevent race conditions or double bookings.

### 4.7 Reviews, Ratings & Community Trust

- **Strict Post-Confirmation Eligibility**: Reviews (1–5 stars + optional text) can only be submitted for bookings that reached `confirmed` status. Unconfirmed viewings or canceled requests are strictly barred from reviewing.
- **Duplicate Prevention**: Exactly one review permitted per confirmed booking.
- **Single Provider Response**: The reviewed party has the right to post exactly one public response to a review.
- **Moderation**: Inappropriate or reported reviews can be reviewed and moderated by platform administrators.

### 4.8 Reports & Progressive Dispute Resolution

- **Text-Only Reporting**: Dedicated reporting workflow for students and providers to report misleading advertisements, fraudulent behavior, harassment, or platform violations.
- **Report Lifecycle**: Tracks through four states: `New` -> `Under Review` -> `Responded` -> `Closed`.
- **Administrative Intervention**: Priority escalation for serious fraud or repeated listing violations, empowering admins to suspend accounts or delist properties.

### 4.9 Administration, Audit & Analytics

- **Superadmin Console**: Unified administration interface managing accounts, KYC submissions, property approval queues, booking monitors, reviews, reports, and global settings.
- **Immutable Audit Logging**: Automatic recording of all administrative operations (approvals, rejections, bans, config changes) in `AdminActionLog` with timestamp, admin ID, and JSON payload diffs.
- **Market Analytics Engine**: Aggregates macro and micro platform metrics: active listings per city/area, student demand volume per university, average price per bed, and request-to-confirmation conversion rates.

---

## 5. Pilot Market Strategy

1. **Geographic Focus**: Initial launch concentrated around one major educational corridor in Greater Cairo (e.g., Cairo University / Giza / Dokki or 6th of October City / MUST / October 6 University).
2. **Provider Acquisition**: Direct recruitment of verified building owners and authorized property managers via dedicated offline and online onboarding assistance.
3. **Free Listing Allowance**: Free property listings during the pilot period to remove barriers to entry for providers (threshold confirmed via Founder Open Questions).
4. **Student Activation**: On-campus student union partnerships, orientation campaigns, and social channels emphasizing verified properties, zero broker fees, and direct owner contact.

---

## 6. Business Model & Financial Strategy

- **Zero Student Fees**: Free registration, free search, free booking requests, and free messaging for students.
- **Zero Commission**: The platform collects 0% rental commission from students and property owners on MVP tenancies.
- **Future Commercial Roadmap**:
  - Listing fees / subscription packages for property providers exceeding the free pilot allowance.
  - Featured / sponsored listings for premium visibility.
  - Value-added platform service fees (electronic utility payments, legal template verification).
  - Note: Online rent collection is deliberately deferred post-MVP.

---

## 7. Assumptions & Dependencies (Adhering to "NEVER GUESS")

- **Mapping**: Google Maps API configured for Egyptian geocoding, autocomplete, and campus distance calculation.
- **Media Hosting**: Cloudinary configured for image storage, optimization, and responsive delivery.
- **SMS Gateway**: SMS/OTP delivery provider to be confirmed by the founder; development environment uses a mock OTP verification service.
- **Sensitive Storage**: Secure private cloud bucket (AWS S3 Private / GCS) for KYC National IDs and deeds.
- **No Inventions**: Pricing amounts, cancellation penalties, legal leases, and payment processing rules are strictly excluded from MVP scope per `app.txt`.

# MVP SCOPE SPECIFICATION (نطاق النسخة التجريبية الأولى)

## Egyptian Student Housing Platform (منصة سكن الطلاب في مصر)

- **Platform Vision**: The premier verified technology marketplace connecting university students with verified accommodation providers across Egypt.
- **Operating Principle**: Strictly adherence to **Rule 1 (NEVER GUESS)** and MVP priority guidelines defined in **Section 17 of `app.txt`**.
- **Last Updated**: 2026-11-20T23:15:00Z.

---

## 1. Executive Summary & Marketplace Boundaries

The primary objective of the Minimum Viable Product (MVP) is to solve the critical trust, discovery, and communication breakdown in Egyptian student housing.

### Core Marketplace Boundaries (What the Platform IS and IS NOT)

1. **The platform IS an intermediary technology marketplace**: It connects students searching for accommodation with verified property owners and managers, facilitating discovery, viewing arrangement, and agreement confirmation.
2. **The platform IS NOT a real estate brokerage**: It does not take brokerage commissions from students or property owners in the MVP.
3. **The platform IS NOT a property rental management company**: It does not act as a landlord, does not physically manage tenant stays, does not arbitrate civil tenancy disputes, and does not determine rental contract durations.
4. **The platform DOES NOT collect rent in MVP**: All financial transactions regarding rent, utility bills, and security deposits are executed directly and independently between the student and the property owner offline.
5. **The platform DOES NOT employ speculative algorithms**: In MVP, discovery is transparent and deterministic based on user-selected criteria and geographic proximity.

---

## 2. In-Scope MVP Feature Inventory

The following features represent the mandatory, fully functional scope of the MVP release. Every listed feature must maintain real state and complete business logic (no facades or dummy mockups).

|   #    | Domain Area                   | In-Scope MVP Feature                      | Description & Acceptance Boundaries                                                                                                                                       |     User Persona      |
| :----: | :---------------------------- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------: |
| **1**  | **Authentication & Identity** | Student Phone OTP Registration            | Registration via valid Egyptian mobile phone number (`+20`); verification using one-time passcode (OTP); rate-limited generation.                                         |        Student        |
| **2**  | **Authentication & Identity** | Mandatory University Association          | Student profile must specify university from pre-seeded Egyptian university catalog. Student ID card / enrollment proof upload is optional.                               |        Student        |
| **3**  | **Authentication & Identity** | Phone Number Update Flow                  | Secure phone number modification requiring OTP verification on the new mobile number before commit.                                                                       |    Student, Owner     |
| **4**  | **Authentication & Identity** | Provider Category Onboarding              | Registration distinguishing 3 legal provider types: Individual Owner, Legally Authorized Agent, Registered Property Management Company.                                   |   Property Provider   |
| **5**  | **Authentication & Identity** | Provider KYC Verification Submission      | Mandatory upload of National ID (بطاقة الرقم القومي) and title deed / authorization deed (سند الملكية / التوكيل الرسمي). Publishing blocked until approved.               |   Property Provider   |
| **6**  | **Authentication & Identity** | Single Seeded Superadministrator          | Platform initializes a single superadmin account via secure CLI / database seed. No public admin registration endpoint exists.                                            |     Administrator     |
| **7**  | **Geographic Catalog**        | Egyptian Location Directory               | Pre-populated catalog of Egyptian governorates, cities, university areas, and universities with main campus geographic coordinates.                                       |       All Users       |
| **8**  | **Listings & Inventory**      | 4-Tier Accommodation Hierarchy            | Support for: (1) Entire residential building, (2) Complete apartment/unit, (3) Private single room, (4) Shared room, (5) Individual bed in a shared room.                 |   Property Provider   |
| **9**  | **Listings & Inventory**      | Flexible Pricing & Itemized Expenses      | Pricing in Egyptian Pounds (EGP) per person, bed, room, or complete unit across daily, weekly, monthly, semester, and yearly terms. Itemized mandatory/optional expenses. |   Property Provider   |
| **10** | **Listings & Inventory**      | Cloudinary Property Media Management      | Secure multi-image upload, automated WebP compression, aspect ratio normalization, cover image selection, and re-ordering.                                                |   Property Provider   |
| **11** | **Listings & Inventory**      | Administrative Listing Moderation         | New listings and major updates (address change, room count modification) enter `PENDING_REVIEW` queue; hidden from public search until admin approval.                    |     Administrator     |
| **12** | **Search & Discovery**        | Multi-Parameter Search Engine             | Filter by city, area, university, max distance to main campus, budget (min/max EGP), accommodation type, and gender policy (male, female, family).                        |    Student, Public    |
| **13** | **Search & Discovery**        | Proximity Distance Calculation            | Accurate distance in kilometers calculated from property geocoordinates to the target university's main campus coordinates.                                               |    Student, Public    |
| **14** | **Search & Discovery**        | Dual Synchronized View (Cards & Maps)     | Seamless switching between responsive property card grid and interactive Google Maps pin view with synchronized hover highlights.                                         |    Student, Public    |
| **15** | **Search & Discovery**        | Transparent Proximity Sorting             | Default search ranking sorts listings by suitability and distance to selected university campus without paid promotion bias.                                              |    Student, Public    |
| **16** | **Booking & Agreements**      | 3 Open Booking Requests Limit             | Student can have a maximum of 3 active booking requests (`PENDING` or `ACCEPTED`) across the platform. 4th submission is rejected (HTTP 400).                             |        Student        |
| **17** | **Booking & Agreements**      | 1 Confirmed Booking Invariant             | Student cannot hold more than 1 active `CONFIRMED` booking. Attempting to confirm a second booking is rejected (HTTP 409).                                                |        Student        |
| **18** | **Booking & Agreements**      | Provider Decision Flow                    | Property owner can accept or reject booking requests. Rejection does not require mandatory justification. Student can cancel unconfirmed requests.                        |    Student, Owner     |
| **19** | **Booking & Agreements**      | Mutual Agreement Confirmation             | Two-party confirmation: both student and provider must confirm the agreement in-app to finalize the reservation. Optional contract document upload.                       |    Student, Owner     |
| **20** | **Booking & Agreements**      | Concurrency Lock & Partial Availability   | PostgreSQL atomic transaction with row locking (`SELECT FOR UPDATE`). Booked portion becomes `BOOKED`; competing pending requests auto-closed.                            |        System         |
| **21** | **Communication**             | Request-Linked 1:1 Direct Chat            | In-app text chat automatically created upon booking request submission. Permanent conversation thread retained even if request is canceled/rejected.                      |    Student, Owner     |
| **22** | **Communication**             | Immediate Contact Disclosure              | System reveals student and provider name, phone number, and email upon booking request creation to facilitate independent viewing coordination.                           |    Student, Owner     |
| **23** | **Notifications**             | In-App Notification Center                | Real-time notifications for booking status updates, new messages, KYC approvals, and review submissions with unread counters.                                             | Student, Owner, Admin |
| **24** | **Reputation & Safety**       | Post-Confirmation Review Qualification    | Reviews (1–5 star rating + text) strictly permitted only after a confirmed booking agreement. Unconfirmed viewings do not qualify.                                        |        Student        |
| **25** | **Reputation & Safety**       | Single Provider Review Response           | Reviewed property provider may publish exactly one formal response to each review. Multiple back-and-forth arguments barred.                                              |   Property Provider   |
| **26** | **Reputation & Safety**       | Text-Only Violation Reporting System      | Abuse reporting for misleading listings, harassment, or scam attempts. Structured status workflow: New → Under Review → Responded → Closed.                               |       All Users       |
| **27** | **Administration**            | Superadmin Control Panel                  | Unified web console to inspect user accounts, verify KYC submissions, moderate property listings, inspect booking disputes, and manage reports.                           |     Administrator     |
| **28** | **Administration**            | Immutable Administrative Audit Log        | Non-bypassable audit logging (`AdminActionLog`) recording all admin actions, timestamps, affected entities, and JSON state diffs.                                         |     Administrator     |
| **29** | **Administration**            | Platform Analytics & Metrics              | Real-time dashboard tracking platform supply, demand, average price trends, and conversion rates across Egyptian cities and universities.                                 |     Administrator     |
| **30** | **User Experience**           | Bilingual Arabic (RTL) & English (LTR) UI | Comprehensive localization toggle; Egyptian Arabic primary with Cairo font, English secondary with Inter font; Orange & Navy design system.                               |       All Users       |

---

## 3. Explicitly Deferred / Out-of-Scope Roadmap Matrix

In strict compliance with **Section 16 (Rule 6: Never implement a future feature as part of MVP without approval)** and **Section 17 of `app.txt`**, the following features are explicitly deferred to post-MVP roadmap phases. No database columns, API endpoints, or UI controls should prematurely implement these concepts.

|   #   | Deferred Feature                                      | Why Deferred from MVP                                                                                                                                                                                                           | Impact on Architecture                                                                                                   |          Planned Phase           |
| :---: | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------- | :------------------------------: |
| **1** | **In-App Rental Payment Gateway & Escrow**            | In MVP, the platform does NOT collect rent, deposit funds, or charge tenant transaction fees. Payment integration (e.g., Paymob, Fawry, Vodafone Cash) introduces financial liability, banking licenses, and escrow compliance. | Rent and deposit paid offline between parties. Backend maintains pricing metadata only, not transactional ledgers.       | Phase 14+ (Commercial Expansion) |
| **2** | **Automated Roommate Compatibility Matching**         | Algorithmic personality matching, lifestyle surveys, and automated co-tenant pairing require deep user sample sizes and AI heuristic validation that complicate the core marketplace launch.                                    | Students book private rooms, entire units, or choose specific beds in shared rooms directly without algorithmic pairing. |      Post-MVP Feature Pack       |
| **3** | **Multi-Currency & International Student Engine**     | Initial pilot focuses strictly on domestic Egyptian university students (both local and relocating). Multi-currency pricing (USD, EUR, SAR) and passport-based KYC add unnecessary friction to Egyptian pilot launch.           | Currency is strictly locked to Egyptian Pounds (EGP). Phone numbers locked to Egyptian country code (`+20`).             |  Phase 14+ (Regional Expansion)  |
| **4** | **Digital Legal Lease Signing (E-Signature Engine)**  | In MVP, the platform records mutual agreement confirmation and allows optional PDF upload. Legally binding e-signatures under Egyptian Law No. 15 of 2004 require accredited e-signature certification (ITIDA).                 | System provides mutual confirmation timestamps and document upload rather than certified legal e-signatures.             |    Post-MVP Enterprise Module    |
| **5** | **Independent Native Mobile Apps (iOS & Android)**    | Developing, maintaining, and deploying native iOS and Android apps during early discovery introduces redundant codebase overhead and slow iteration cycles.                                                                     | The Next.js web application is built mobile-first, fully responsive, and PWA-ready for mobile browsers.                  |    Post-MVP Native Apps Phase    |
| **6** | **Featured Paid Listings & Provider Subscriptions**   | Monetization features (pay-to-feature listings, tier-based provider subscriptions) are deferred during the initial pilot launch to eliminate barriers to provider onboarding.                                                   | Pilot provides free property listings to attract initial supply. Subscription architecture deferred.                     |  Commercial Monetization Phase   |
| **7** | **Interactive 3D Virtual Walkthroughs & Video Tours** | High-bandwidth 3D tours and video processing increase hosting infrastructure costs and complicate provider listing creation.                                                                                                    | MVP relies on high-resolution, Cloudinary-optimized photo galleries.                                                     |    Media Enhancements Roadmap    |
| **8** | **Public Broker Role & Commission Engine**            | The platform explicitly bans unauthorized brokers and does not support broker commission splits in MVP.                                                                                                                         | Provider accounts are restricted to verified owners, legal agents, and property management companies.                    |   Future Enterprise Broker B2B   |

---

## 4. MVP User Persona Feature Matrix

| Feature / Capability                      | Public Visitor |   Student User    | Property Provider | Superadministrator |
| :---------------------------------------- | :------------: | :---------------: | :---------------: | :----------------: |
| Browse Published Listings & Photos        |       ✅       |        ✅         |        ✅         |         ✅         |
| Search by University & Filter by Budget   |       ✅       |        ✅         |        ✅         |         ✅         |
| View Interactive Map Pins                 |       ✅       |        ✅         |        ✅         |         ✅         |
| Register via Egyptian Mobile OTP          |       ❌       |        ✅         |        ✅         |  ❌ (Seeded CLI)   |
| Upload KYC Identity / Ownership Documents |       ❌       |        ❌         |        ✅         |         ❌         |
| Create & Manage Property Inventory        |       ❌       |        ❌         |        ✅         |  ✅ (Admin Edit)   |
| Submit Booking Request (Max 3)            |       ❌       |        ✅         |        ❌         |         ❌         |
| Accept / Reject Booking Request           |       ❌       |        ❌         |        ✅         |         ❌         |
| Mutually Confirm Rental Agreement (Max 1) |       ❌       |        ✅         |        ✅         |         ❌         |
| 1:1 In-App Text Messaging                 |       ❌       |        ✅         |        ✅         |         ❌         |
| View Revealed Contact Information         |       ❌       |  ✅ (On Request)  |  ✅ (On Request)  |         ✅         |
| Submit Review (1–5 Stars)                 |       ❌       | ✅ (Post-Booking) |        ❌         |         ❌         |
| Submit Single Review Response             |       ❌       |        ❌         | ✅ (Post-Review)  |         ❌         |
| Submit Text-Only Complaint Report         |       ❌       |        ✅         |        ✅         |         ❌         |
| Approve / Reject KYC Verifications        |       ❌       |        ❌         |        ❌         |         ✅         |
| Moderate & Approve Property Listings      |       ❌       |        ❌         |        ❌         |         ✅         |
| View Immutable Admin Action Logs          |       ❌       |        ❌         |        ❌         |         ✅         |
| View Platform Analytics & Metrics         |       ❌       |        ❌         |        ❌         |         ✅         |

---

## 5. Scope Boundary Validation Rules

To prevent scope creep during engineering execution:

1. **Rule of Relational Simplicity**: Any entity or relation not represented in the 26 conceptual entities of `app.txt` Section 8 is barred unless proven necessary for architectural stability.
2. **Rule of Direct Contact**: Any proposal to build a complex in-app viewing booking calendar with automated reminders must be deferred; immediate contact disclosure (phone/email) provides the fastest, most natural way for Egyptian users to schedule viewings.
3. **Rule of Single Response**: Any proposal to build threaded nested discussion boards under property listings is barred; the platform maintains simple 1-review, 1-response reputation records.
4. **Rule of No Financial Escrow**: Any code attempting to hold or release rent payments must be rejected immediately during code reviews.

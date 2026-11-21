# User Roles, Permissions & Access Control Matrix

## Egyptian Student Housing Platform _(منصة سكن الطلاب في مصر)_

---

## 1. Overview & Role Hierarchy

The platform defines a role-based access control (RBAC) architecture designed to guarantee system integrity, tenant safety, and compliance with Egyptian legal norms.

There are three primary authenticated role classes:

1. **Student (`STUDENT`)**
2. **Property Provider (`OWNER`)** — partitioned into three legal classifications:
   - `INDIVIDUAL_OWNER` (Direct Owner)
   - `AUTHORIZED_AGENT` (Legally Authorized Agent)
   - `MANAGEMENT_COMPANY` (Property Management Company)
3. **Superadministrator (`ADMIN`)**

### 1.1 Prohibited & Excluded Roles

- **No Public Broker Role**: In strict adherence to `app.txt` (Section 4, Lines 187–189), the platform does **not** provide a broker user role. Informal, unauthorized real estate brokers (_sammasra_) are strictly prohibited from registering or publishing listings.
- **No Self-Registered Administrators**: Administrator accounts cannot be created via public sign-up endpoints. The system recognizes a single seeded superadministrator created during database provisioning.

---

## 2. Granular Role Definitions

### 2.1 Student Role (`STUDENT`)

The Student role represents university students and academic learners seeking housing accommodation in Egypt.

- **Target Users**:
  - Enrolled students at Egyptian public, private, and national (_Ahleya_) universities.
  - Students at higher technical institutes and specialized colleges.
  - Relocating students (_mughtaribeen_) moving across governorates.
  - Local students seeking accommodation closer to suburban university campuses.
  - Non-enrolled learners (e.g., medical residents, postgraduate exam candidates, graduates) with designated platform intent.
- **Account Identity & Registration**:
  - Mandatory Egyptian mobile phone number (`+20`) verified via SMS OTP.
  - Mandatory university association selected from the platform's active university registry.
  - Optional faculty / major specification.
  - Optional university enrollment proof upload (e.g., student ID card or tuition receipt).
  - Optional profile photo.
- **Operational Constraints**:
  - Maximum of **3 open booking requests** simultaneously across the platform (`BR-BKG-001`).
  - Maximum of **1 active confirmed booking** across the platform (`BR-BKG-002`).
  - Direct contact information (Name, Phone, Email) revealed to the provider immediately upon request submission (`BR-BKG-003`).
  - Cancellation history tracked internally; hidden from public profile (`BR-BKG-005`).

---

### 2.2 Property Provider Role (`OWNER`)

The Property Provider role represents entities with legal title or formal authorization to lease residential real estate to students.

#### Legal Classifications & KYC Requirements

| Provider Sub-Type        | Description                                                                      | Required Verification Documents (KYC)                                                                                                                           | Verification Authority |
| :----------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| **`INDIVIDUAL_OWNER`**   | Direct physical property owner leasing units they own.                           | 1. Valid Egyptian National ID Card (_Betaka Raqam Qawmi_).<br>2. Registered Property Ownership Deed / Contract (_Aqd Melkeya_).                                 | Platform Superadmin    |
| **`AUTHORIZED_AGENT`**   | An individual authorized by the property owner to manage and lease the property. | 1. Valid Egyptian National ID Card.<br>2. Official Notarized Power of Attorney issued by the Real Estate Publicity Dept (_Tawkeel Rasmi mn El-Shahr El-Aqary_). | Platform Superadmin    |
| **`MANAGEMENT_COMPANY`** | Registered commercial entity managing student residences or apartments.          | 1. Commercial Registry (_Segell Togari_).<br>2. Tax Card (_Betaka Darebeya_).<br>3. Authorized Representative National ID.                                      | Platform Superadmin    |

- **Lifecycle & Publishing Gate**:
  - Newly registered providers start in `UNVERIFIED` status.
  - Providers **cannot** publish listings or have properties appear in search results until their identity and property documents have been approved by an administrator (`verification_status = 'VERIFIED'`).
  - Verified providers may create hierarchical inventory (Buildings, Units, Rooms, Beds).
  - Providers can accept or reject student booking requests without mandatory justification (`BR-BKG-004`).
  - Entitled to exactly one public response per student review (`BR-REV-003`).

---

### 2.3 Superadministrator Role (`ADMIN`)

The Superadmin is the system operator with unrestricted governance and audit authority.

- **Initialization & Provisioning**:
  - Initial administrator account is seeded manually via CLI or database seed script.
  - Zero public sign-up or invitation endpoint for admin accounts.
- **Core Governance Responsibilities**:
  - **KYC Verification**: Review and approve/reject provider National IDs, property deeds, and commercial registries.
  - **Listing Moderation**: Review and approve/reject newly submitted listings and significant listing updates.
  - **Dispute Resolution**: Investigate text-only reports regarding fraud, misleading listings, or misconduct.
  - **Platform Configuration**: Manage active cities, universities, and system-wide settings (e.g., pilot free listing limits).
  - **Audit Inspection**: Inspect the immutable `AdminActionLog` recording all administrative actions.

---

## 3. Comprehensive Permission Matrix

The following matrix details access permissions across all platform entities and operational endpoints.

| Functional Area / Operation                   | Guest / Public |  Student (`STUDENT`)  | Provider (`OWNER`) - Unverified | Provider (`OWNER`) - Verified | Superadmin (`ADMIN`) |
| :-------------------------------------------- | :------------: | :-------------------: | :-----------------------------: | :---------------------------: | :------------------: |
| **Authentication & Profile**                  |                |                       |                                 |                               |                      |
| View Public Landing & Info Pages              |    Allowed     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| Register Student Account (Phone + OTP)        |    Allowed     |           —           |                —                |               —               |          —           |
| Register Provider Account                     |    Allowed     |           —           |                —                |               —               |          —           |
| Update Own Phone (via OTP)                    |     Denied     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| Upload / Update KYC Documents                 |     Denied     |        Denied         |             Allowed             |      Allowed (Re-verify)      |        Denied        |
| View Other Users' KYC Documents               |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| **Search & Discovery**                        |                |                       |                                 |                               |                      |
| Search Listings (Cards & Map)                 |    Allowed     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| View Published Property Details               |    Allowed     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| View Unapproved / Pending Listings            |     Denied     |        Denied         |            Own Only             |           Own Only            |    Allowed (All)     |
| **Property Management**                       |                |                       |                                 |                               |                      |
| Create Property / Unit / Room / Bed           |     Denied     |        Denied         |           Draft Only            |            Allowed            |       Allowed        |
| Upload Property Photos (Cloudinary)           |     Denied     |        Denied         |             Allowed             |            Allowed            |       Allowed        |
| Publish Property (Submit for Review)          |     Denied     |        Denied         |         Blocked (`403`)         |            Allowed            |       Allowed        |
| Edit Own Property Details                     |     Denied     |        Denied         |             Allowed             |   Allowed (Triggers Review)   |       Allowed        |
| Delete / Archive Own Property                 |     Denied     |        Denied         |             Allowed             |            Allowed            |       Allowed        |
| Moderate / Approve Property Listings          |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| **Booking Requests & Agreements**             |                |                       |                                 |                               |                      |
| Submit Booking Request (Target Bed/Room/Unit) |     Denied     |    Allowed (Max 3)    |             Denied              |            Denied             |        Denied        |
| View Own Booking Requests                     |     Denied     |        Allowed        |             Allowed             |            Allowed            |    Allowed (All)     |
| Cancel Own Unconfirmed Request                |     Denied     |        Allowed        |             Denied              |            Denied             |       Allowed        |
| Accept / Reject Booking Request               |     Denied     |        Denied         |             Denied              |    Allowed (Own Listings)     |       Allowed        |
| View Contact Details upon Request             |     Denied     | Allowed (Counterpart) |             Denied              |     Allowed (Counterpart)     |       Allowed        |
| Mutually Confirm Booking Agreement            |     Denied     |        Allowed        |             Denied              |            Allowed            |       Allowed        |
| Upload Optional Agreement Document            |     Denied     |        Allowed        |             Denied              |            Allowed            |       Allowed        |
| Close Conflicting Competing Requests          |     Denied     |      System Auto      |             Denied              |          System Auto          |       Allowed        |
| **Messaging & Notifications**                 |                |                       |                                 |                               |                      |
| Send Message in Request Conversation          |     Denied     | Allowed (Participant) |             Denied              |     Allowed (Participant)     |       Allowed        |
| View Request Conversation History             |     Denied     | Allowed (Participant) |             Denied              |     Allowed (Participant)     |   Allowed (Audit)    |
| Receive In-App Notifications                  |     Denied     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| **Reviews & Complaints**                      |                |                       |                                 |                               |                      |
| Submit Review (Post-confirmed only)           |     Denied     | Allowed (Own Booking) |             Denied              |     Allowed (Own Booking)     |        Denied        |
| Submit Response to Review (Max 1)             |     Denied     |  Allowed (Recipient)  |             Denied              |      Allowed (Recipient)      |        Denied        |
| Submit Text-Only Report / Complaint           |     Denied     |        Allowed        |             Allowed             |            Allowed            |       Allowed        |
| Update Report Status & Resolve                |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| Delete Inappropriate Reviews                  |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| **Administration & System**                   |                |                       |                                 |                               |                      |
| Access Admin Dashboard & Analytics            |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| Approve / Reject Provider Verification        |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| Inspect `AdminActionLog`                      |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| Manage Cities & Universities Directory        |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |
| Modify System Configuration Settings          |     Denied     |        Denied         |             Denied              |            Denied             |       Allowed        |

---

## 4. Session & Lifecycle Management

### 4.1 Authentication Protocols

- **Token Mechanism**: Stateless JSON Web Tokens (JWT) comprising:
  - Short-lived Access Token (15 minutes expiry) containing `sub` (User ID), `role` (`STUDENT` | `OWNER` | `ADMIN`), `provider_type` (if applicable), and `verification_status`.
  - Secure, HTTP-only, SameSite Refresh Token (7 days expiry) stored with cryptographic hash in the database.
- **Password Security**: Strong hashing using Argon2id or bcrypt (cost factor $\ge 12$).

### 4.2 Account Lifecycle States

1. `UNVERIFIED_PHONE`: User initiated registration; awaiting SMS OTP validation.
2. `ACTIVE`: User authenticated. Students can immediately browse, search, and submit booking requests.
3. `PENDING_KYC`: Provider submitted identity documents; awaiting superadmin review.
4. `VERIFIED`: Provider approved by admin; full publishing rights granted.
5. `SUSPENDED / BANNED`: Account locked by administrator due to severe misconduct, fraud, or terms violation. All active listings unpublished; pending requests terminated.

---

## 5. Security Scopes & Data Isolation Invariants

1. **Student Isolation**: A student user may never access or mutate another student’s profile, requests, or private messages.
2. **Provider Inventory Isolation**: A provider cannot edit, delete, or inspect unapproved draft listings belonging to another provider.
3. **Private Document Protection**: Verification documents (National IDs, title deeds) are completely isolated in private storage and strictly barred from public serialization endpoints.
4. **Audit Non-Bypassability**: Every administrative write action must emit an immutable `AdminActionLog` record within the active database transaction.

# Database Migrations & Seed Data Pipeline

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & Database Architecture
- **Document Path**: `docs/database/migrations.md`
- **Target Engine**: PostgreSQL 16+
- **Execution CLI**: `npm run migration:run -w apps/api` | `npm run seed -w apps/api`

---

## 1. Migration Management Framework

### 1.1 Architecture & CLI Workflows

Database migrations reside under `apps/api/src/database/migrations/`. They are executed deterministically using TypeORM / raw SQL migration runners wrapped in atomic transactions.

```bash
# Run all pending migrations
npm run migration:run -w apps/api

# Revert the most recently executed migration
npm run migration:revert -w apps/api

# Run database seeders (Cities, Universities, Settings, Superadmin)
npm run seed -w apps/api
```

### 1.2 Idempotency & Rollback Contract

Every migration file must strictly adhere to the following contracts:

1. **Atomic Transaction Wrapper**: Every migration script must be enclosed within an explicit `BEGIN;` and `COMMIT;` block. If any statement encounters a failure, the entire migration aborts and rolls back cleanly without leaving the schema in a corrupted state.
2. **Deterministic Rollback (`down`)**: Every `up` migration script has an exact, fully tested `down` reversal script that completely tears down newly introduced tables, columns, indexes, or enums in reverse dependency order.
3. **Zero-Downtime Expand-and-Contract Rule**: During production deployments, schema additions (new columns, nullable fields, new tables) are executed first. Destructive changes (column renames, column drops) are never executed in a single release step.

---

## 2. Deterministic 12-Stage Migration Sequence

The database schema is structured into 12 numbered, sequential migration stages that establish foundations, core entities, hierarchical accommodations, transactional engines, and spatial performance indexes.

```
+-----------------------------------------------------------------------------------------------+
|                             12-STAGE MIGRATION SEQUENCE PIPELINE                              |
+-----------------------------------------------------------------------------------------------+
| 001_create_extensions_and_enums.sql            --> PostgreSQL extensions & custom types       |
| 002_create_users_and_profiles.sql              --> users, student_profiles, provider_profiles |
| 003_create_geography_and_universities.sql      --> cities, areas, universities                |
| 004_create_properties_and_verifications.sql    --> properties, property_images, verifications |
| 005_create_units_rooms_beds.sql                --> property_units, rooms, beds                |
| 006_create_pricing_and_expenses.sql            --> pricings, additional_expenses              |
| 007_create_availabilities.sql                  --> availabilities (concurrency engine)        |
| 008_create_booking_and_agreements.sql          --> booking_requests, agreements, documents    |
| 009_create_conversations_and_messages.sql      --> conversations, messages                    |
| 010_create_notifications_reviews_reports.sql   --> notifications, reviews, responses, reports |
| 011_create_admin_logs_and_settings.sql         --> admin_action_logs, platform_settings       |
| 012_create_performance_indexes_and_spatial.sql --> spatial math & partial compound indexes   |
+-----------------------------------------------------------------------------------------------+
```

---

### Migration 001: `001_create_extensions_and_enums.sql`

- **Scope**: Initialize required PostgreSQL extensions and system enums.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "cube";
  CREATE EXTENSION IF NOT EXISTS "earthdistance";

  CREATE TYPE user_role_enum AS ENUM ('STUDENT', 'OWNER', 'ADMIN');
  CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
  CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE');
  CREATE TYPE provider_type_enum AS ENUM ('INDIVIDUAL_OWNER', 'AUTHORIZED_AGENT', 'MANAGEMENT_COMPANY');
  CREATE TYPE verification_status_enum AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
  CREATE TYPE property_type_enum AS ENUM ('BUILDING', 'APARTMENT', 'ROOM', 'BED');
  CREATE TYPE gender_policy_enum AS ENUM ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED_FAMILY');
  CREATE TYPE property_approval_enum AS ENUM ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');
  CREATE TYPE furnished_status_enum AS ENUM ('FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED');
  CREATE TYPE room_type_enum AS ENUM ('PRIVATE', 'SHARED');
  CREATE TYPE bed_type_enum AS ENUM ('SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM');
  CREATE TYPE pricing_entity_enum AS ENUM ('PROPERTY', 'UNIT', 'ROOM', 'BED');
  CREATE TYPE pricing_unit_enum AS ENUM ('PER_PERSON', 'PER_BED', 'PER_ROOM', 'PER_UNIT');
  CREATE TYPE duration_unit_enum AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY');
  CREATE TYPE billing_frequency_enum AS ENUM ('ONE_TIME', 'MONTHLY', 'SEMESTER', 'YEARLY');
  CREATE TYPE availability_status_enum AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'MAINTENANCE', 'UNAVAILABLE');
  CREATE TYPE booking_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'CLOSED_CONFLICT');
  CREATE TYPE agreement_status_enum AS ENUM ('PENDING_APPROVAL', 'STUDENT_APPROVED', 'OWNER_APPROVED', 'CONFIRMED', 'CANCELLED');
  CREATE TYPE report_category_enum AS ENUM ('MISLEADING_LISTING', 'FRAUD', 'HARASSMENT', 'SAFETY_CONCERN', 'INAPPROPRIATE_CONTENT', 'OTHER');
  CREATE TYPE report_status_enum AS ENUM ('NEW', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED');
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TYPE IF EXISTS report_status_enum CASCADE;
  DROP TYPE IF EXISTS report_category_enum CASCADE;
  DROP TYPE IF EXISTS agreement_status_enum CASCADE;
  DROP TYPE IF EXISTS booking_status_enum CASCADE;
  DROP TYPE IF EXISTS availability_status_enum CASCADE;
  DROP TYPE IF EXISTS billing_frequency_enum CASCADE;
  DROP TYPE IF EXISTS duration_unit_enum CASCADE;
  DROP TYPE IF EXISTS pricing_unit_enum CASCADE;
  DROP TYPE IF EXISTS pricing_entity_enum CASCADE;
  DROP TYPE IF EXISTS bed_type_enum CASCADE;
  DROP TYPE IF EXISTS room_type_enum CASCADE;
  DROP TYPE IF EXISTS furnished_status_enum CASCADE;
  DROP TYPE IF EXISTS property_approval_enum CASCADE;
  DROP TYPE IF EXISTS gender_policy_enum CASCADE;
  DROP TYPE IF EXISTS property_type_enum CASCADE;
  DROP TYPE IF EXISTS verification_status_enum CASCADE;
  DROP TYPE IF EXISTS provider_type_enum CASCADE;
  DROP TYPE IF EXISTS gender_enum CASCADE;
  DROP TYPE IF EXISTS user_status_enum CASCADE;
  DROP TYPE IF EXISTS user_role_enum CASCADE;
  COMMIT;
  ```

---

### Migration 002: `002_create_users_and_profiles.sql`

- **Scope**: Core identity principals and role extensions.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'OWNER', 'ADMIN')),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
      is_phone_verified BOOLEAN NOT NULL DEFAULT false,
      phone_verified_at TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE UNIQUE INDEX idx_users_phone ON users (phone);
  CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
  CREATE INDEX idx_users_role_status ON users (role, status);

  CREATE TABLE property_provider_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      provider_type VARCHAR(30) NOT NULL CHECK (provider_type IN ('INDIVIDUAL_OWNER', 'AUTHORIZED_AGENT', 'MANAGEMENT_COMPANY')),
      company_name VARCHAR(200),
      commercial_reg_no VARCHAR(100),
      tax_card_no VARCHAR(100),
      full_name VARCHAR(150) NOT NULL,
      national_id_number VARCHAR(20) NOT NULL,
      verification_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')),
      verified_at TIMESTAMPTZ,
      rejection_reason TEXT,
      bio TEXT,
      avatar_url VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE UNIQUE INDEX idx_provider_profiles_user_id ON property_provider_profiles (user_id);
  CREATE INDEX idx_provider_profiles_status ON property_provider_profiles (verification_status);
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS property_provider_profiles CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  COMMIT;
  ```

---

### Migration 003: `003_create_geography_and_universities.sql`

- **Scope**: Cities, areas, universities, and student profile attachment.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE cities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name_ar VARCHAR(100) NOT NULL UNIQUE,
      name_en VARCHAR(100) NOT NULL UNIQUE,
      governorate_ar VARCHAR(100) NOT NULL,
      governorate_en VARCHAR(100) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE areas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
      name_ar VARCHAR(100) NOT NULL,
      name_en VARCHAR(100) NOT NULL,
      center_latitude NUMERIC(10, 7),
      center_longitude NUMERIC(10, 7),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE universities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name_ar VARCHAR(150) NOT NULL UNIQUE,
      name_en VARCHAR(150) NOT NULL UNIQUE,
      city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
      area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
      main_campus_latitude NUMERIC(10, 7) NOT NULL,
      main_campus_longitude NUMERIC(10, 7) NOT NULL,
      website_url VARCHAR(255),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(150) NOT NULL,
      university_id UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
      faculty VARCHAR(100),
      academic_year VARCHAR(50),
      gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
      bio TEXT,
      avatar_url VARCHAR(500),
      verification_document_url VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE UNIQUE INDEX idx_student_profiles_user_id ON student_profiles (user_id);
  CREATE INDEX idx_student_profiles_university_id ON student_profiles (university_id);
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS student_profiles CASCADE;
  DROP TABLE IF EXISTS universities CASCADE;
  DROP TABLE IF EXISTS areas CASCADE;
  DROP TABLE IF EXISTS cities CASCADE;
  COMMIT;
  ```

---

### Migration 004: `004_create_properties_and_verifications.sql`

- **Scope**: Properties, property images, and KYC verification documents.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE properties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID NOT NULL REFERENCES property_provider_profiles(id) ON DELETE CASCADE,
      title_ar VARCHAR(200) NOT NULL,
      title_en VARCHAR(200) NOT NULL,
      description_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      property_type VARCHAR(30) NOT NULL CHECK (property_type IN ('BUILDING', 'APARTMENT', 'ROOM', 'BED')),
      gender_policy VARCHAR(20) NOT NULL CHECK (gender_policy IN ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED_FAMILY')),
      city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
      area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
      street_address VARCHAR(255) NOT NULL,
      building_number VARCHAR(50) NOT NULL,
      floor_number INT,
      latitude NUMERIC(10, 7) NOT NULL,
      longitude NUMERIC(10, 7) NOT NULL,
      google_place_id VARCHAR(255),
      nearest_university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
      distance_to_university_km NUMERIC(6, 2),
      amenities TEXT[] NOT NULL DEFAULT '{}',
      rules TEXT[] NOT NULL DEFAULT '{}',
      approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (approval_status IN ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
      moderation_note TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE property_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      cloudinary_public_id VARCHAR(255) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(500) NOT NULL,
      caption VARCHAR(255),
      is_cover BOOLEAN NOT NULL DEFAULT false,
      display_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE property_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider_id UUID NOT NULL REFERENCES property_provider_profiles(id) ON DELETE CASCADE,
      property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
      document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('NATIONAL_ID', 'OWNERSHIP_DEED', 'POWER_OF_ATTORNEY', 'COMMERCIAL_REGISTRY', 'TAX_CARD')),
      file_url VARCHAR(500) NOT NULL,
      document_ref_no VARCHAR(100),
      verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMPTZ,
      admin_note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS property_verifications CASCADE;
  DROP TABLE IF EXISTS property_images CASCADE;
  DROP TABLE IF EXISTS properties CASCADE;
  COMMIT;
  ```

---

### Migration 005: `005_create_units_rooms_beds.sql`

- **Scope**: Accommodation hierarchy (units, rooms, beds).
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE property_units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      unit_number VARCHAR(50) NOT NULL,
      floor_number INT NOT NULL,
      total_rooms INT NOT NULL CHECK (total_rooms >= 0),
      total_bathrooms INT NOT NULL DEFAULT 1 CHECK (total_bathrooms >= 1),
      has_kitchen BOOLEAN NOT NULL DEFAULT true,
      has_living_room BOOLEAN NOT NULL DEFAULT true,
      has_balcony BOOLEAN NOT NULL DEFAULT false,
      size_sqm NUMERIC(6, 2),
      furnished_status VARCHAR(20) NOT NULL CHECK (furnished_status IN ('FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED')),
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
      room_number VARCHAR(50) NOT NULL,
      room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('PRIVATE', 'SHARED')),
      capacity INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
      has_private_bathroom BOOLEAN NOT NULL DEFAULT false,
      has_balcony BOOLEAN NOT NULL DEFAULT false,
      has_air_conditioning BOOLEAN NOT NULL DEFAULT false,
      size_sqm NUMERIC(6, 2),
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE beds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      bed_number VARCHAR(50) NOT NULL,
      bed_type VARCHAR(20) NOT NULL CHECK (bed_type IN ('SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM')),
      is_published BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS beds CASCADE;
  DROP TABLE IF EXISTS rooms CASCADE;
  DROP TABLE IF EXISTS property_units CASCADE;
  COMMIT;
  ```

---

### Migration 006: `006_create_pricing_and_expenses.sql`

- **Scope**: Polymorphic pricing and additional expense schedules.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE pricings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
      entity_id UUID NOT NULL,
      pricing_unit VARCHAR(20) NOT NULL CHECK (pricing_unit IN ('PER_PERSON', 'PER_BED', 'PER_ROOM', 'PER_UNIT')),
      duration_unit VARCHAR(20) NOT NULL CHECK (duration_unit IN ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY')),
      amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
      deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE UNIQUE INDEX idx_pricings_entity ON pricings (entity_type, entity_id, duration_unit) WHERE is_active = true;

  CREATE TABLE additional_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      entity_type VARCHAR(20) NOT NULL DEFAULT 'PROPERTY' CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
      entity_id UUID NOT NULL,
      name_ar VARCHAR(100) NOT NULL,
      name_en VARCHAR(100) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
      is_mandatory BOOLEAN NOT NULL DEFAULT true,
      is_recurring BOOLEAN NOT NULL DEFAULT true,
      billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('ONE_TIME', 'MONTHLY', 'SEMESTER', 'YEARLY')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS additional_expenses CASCADE;
  DROP TABLE IF EXISTS pricings CASCADE;
  COMMIT;
  ```

---

### Migration 007: `007_create_availabilities.sql`

- **Scope**: Availability state tracking with concurrency versioning.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE availabilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
      entity_id UUID NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED', 'MAINTENANCE', 'UNAVAILABLE')),
      available_from DATE NOT NULL DEFAULT CURRENT_DATE,
      available_to DATE,
      current_booking_request_id UUID,
      version INT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE UNIQUE INDEX idx_availabilities_entity ON availabilities (entity_type, entity_id);
  CREATE INDEX idx_availabilities_status ON availabilities (status);
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS availabilities CASCADE;
  COMMIT;
  ```

---

### Migration 008: `008_create_booking_and_agreements.sql`

- **Scope**: Booking requests, agreement confirmations, and uploaded contract documents.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE booking_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      target_entity_type VARCHAR(20) NOT NULL CHECK (target_entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
      target_entity_id UUID NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'CLOSED_CONFLICT')),
      requested_move_in_date DATE NOT NULL,
      duration_unit VARCHAR(20) NOT NULL CHECK (duration_unit IN ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY')),
      duration_count INT NOT NULL DEFAULT 1 CHECK (duration_count >= 1),
      student_note TEXT,
      rejection_reason TEXT,
      cancelled_at TIMESTAMPTZ,
      cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('STUDENT', 'SYSTEM')),
      cancellation_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE agreement_confirmations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_request_id UUID NOT NULL UNIQUE REFERENCES booking_requests(id) ON DELETE RESTRICT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'STUDENT_APPROVED', 'OWNER_APPROVED', 'CONFIRMED', 'CANCELLED')),
      student_confirmed BOOLEAN NOT NULL DEFAULT false,
      student_confirmed_at TIMESTAMPTZ,
      owner_confirmed BOOLEAN NOT NULL DEFAULT false,
      owner_confirmed_at TIMESTAMPTZ,
      confirmed_at TIMESTAMPTZ,
      total_amount_egp NUMERIC(10, 2) NOT NULL CHECK (total_amount_egp >= 0),
      deposit_amount_egp NUMERIC(10, 2) NOT NULL DEFAULT 0,
      terms_accepted BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE agreement_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agreement_confirmation_id UUID NOT NULL REFERENCES agreement_confirmations(id) ON DELETE CASCADE,
      uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      file_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size_bytes INT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS agreement_documents CASCADE;
  DROP TABLE IF EXISTS agreement_confirmations CASCADE;
  DROP TABLE IF EXISTS booking_requests CASCADE;
  COMMIT;
  ```

---

### Migration 009: `009_create_conversations_and_messages.sql`

- **Scope**: Direct 1:1 text-only messaging system.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_request_id UUID NOT NULL UNIQUE REFERENCES booking_requests(id) ON DELETE RESTRICT,
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
      owner_id UUID NOT NULL REFERENCES property_provider_profiles(id) ON DELETE RESTRICT,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      body TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  COMMIT;
  ```

---

### Migration 010: `010_create_notifications_reviews_reports.sql`

- **Scope**: In-app notifications, post-booking reviews, responses, and formal dispute reports.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title_ar VARCHAR(200) NOT NULL,
      title_en VARCHAR(200) NOT NULL,
      body_ar TEXT NOT NULL,
      body_en TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE RESTRICT,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
      reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('STUDENT', 'OWNER')),
      reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      is_public BOOLEAN NOT NULL DEFAULT true,
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'FLAGGED', 'REMOVED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE review_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
      responder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      response_text TEXT NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE TABLE reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      reported_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
      reported_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('MISLEADING_LISTING', 'FRAUD', 'HARASSMENT', 'SAFETY_CONCERN', 'INAPPROPRIATE_CONTENT', 'OTHER')),
      details TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED')),
      admin_notes TEXT,
      resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS reports CASCADE;
  DROP TABLE IF EXISTS review_responses CASCADE;
  DROP TABLE IF EXISTS reviews CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  COMMIT;
  ```

---

### Migration 011: `011_create_admin_logs_and_settings.sql`

- **Scope**: Immutable audit log table with trigger guard, and dynamic platform settings.
- **Up Script**:
  ```sql
  BEGIN;
  CREATE TABLE admin_action_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      action VARCHAR(50) NOT NULL,
      target_entity_type VARCHAR(50) NOT NULL,
      target_entity_id UUID NOT NULL,
      changes_diff JSONB NOT NULL,
      ip_address VARCHAR(45),
      user_agent VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );

  CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
  RETURNS TRIGGER AS $$
  BEGIN
      RAISE EXCEPTION 'ERR_IMMUTABLE_LOG_MODIFICATION: admin_action_logs records cannot be updated or deleted.';
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_protect_admin_action_logs
  BEFORE UPDATE OR DELETE ON admin_action_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

  CREATE TABLE platform_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      description VARCHAR(255) NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
  );
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS platform_settings CASCADE;
  DROP TRIGGER IF EXISTS trg_protect_admin_action_logs ON admin_action_logs CASCADE;
  DROP FUNCTION IF EXISTS prevent_audit_log_modification CASCADE;
  DROP TABLE IF EXISTS admin_action_logs CASCADE;
  COMMIT;
  ```

---

### Migration 012: `012_create_performance_indexes_and_spatial.sql`

- **Scope**: Search query optimizations, spatial earthdistance indexes, and partial filter indexes.
- **Up Script**:
  ```sql
  BEGIN;
  -- Search & Filtering Composite Indexes
  CREATE INDEX idx_properties_search ON properties (city_id, area_id, gender_policy, approval_status);
  CREATE INDEX idx_properties_coords_ll_to_earth ON properties USING gist (ll_to_earth(latitude, longitude));

  -- Partial Indexes for Unread Messages & Notifications
  CREATE INDEX idx_messages_unread ON messages (conversation_id, is_read) WHERE is_read = false;
  CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = false;

  -- Active Booking & Request Constraints
  CREATE INDEX idx_booking_active ON booking_requests (student_id, status) WHERE status IN ('PENDING', 'ACCEPTED', 'CONFIRMED');
  CREATE INDEX idx_reviews_rating ON reviews (property_id, rating) WHERE status = 'PUBLISHED';
  COMMIT;
  ```
- **Down Script**:
  ```sql
  BEGIN;
  DROP INDEX IF EXISTS idx_reviews_rating;
  DROP INDEX IF EXISTS idx_booking_active;
  DROP INDEX IF EXISTS idx_notifications_unread;
  DROP INDEX IF EXISTS idx_messages_unread;
  DROP INDEX IF EXISTS idx_properties_coords_ll_to_earth;
  DROP INDEX IF EXISTS idx_properties_search;
  COMMIT;
  ```

---

## 3. Seed Data Pipeline (`apps/api/src/database/seeds/`)

The seeding pipeline runs via `npm run seed -w apps/api` and installs the foundational Egyptian geography, universities, initial platform parameters, and default superadmin account.

### 3.1 Seeder 01: `01-cities-and-areas.seed.ts`

Initializes Egyptian cities and their primary student housing districts:

```typescript
export const seedCitiesAndAreas = async (dataSource: DataSource) => {
  const cityRepo = dataSource.getRepository(City);
  const areaRepo = dataSource.getRepository(Area);

  // 1. Cairo (القاهرة)
  const cairo = await cityRepo.save({
    nameAr: 'القاهرة',
    nameEn: 'Cairo',
    governorateAr: 'محافظة القاهرة',
    governorateEn: 'Cairo Governorate',
    isActive: true,
  });

  await areaRepo.save([
    {
      cityId: cairo.id,
      nameAr: 'مدينة نصر',
      nameEn: 'Nasr City',
      centerLatitude: 30.0566,
      centerLongitude: 31.3301,
    },
    {
      cityId: cairo.id,
      nameAr: 'التجمع الخامس / القاهرة الجديدة',
      nameEn: 'New Cairo / 5th Settlement',
      centerLatitude: 30.0074,
      centerLongitude: 31.4338,
    },
    {
      cityId: cairo.id,
      nameAr: 'مصر الجديدة',
      nameEn: 'Heliopolis',
      centerLatitude: 30.0894,
      centerLongitude: 31.3285,
    },
    {
      cityId: cairo.id,
      nameAr: 'المعادي',
      nameEn: 'Maadi',
      centerLatitude: 29.9602,
      centerLongitude: 31.2569,
    },
    {
      cityId: cairo.id,
      nameAr: 'العباسية',
      nameEn: 'Abbassia',
      centerLatitude: 30.0716,
      centerLongitude: 31.2829,
    },
  ]);

  // 2. Giza (الجيزة)
  const giza = await cityRepo.save({
    nameAr: 'الجيزة',
    nameEn: 'Giza',
    governorateAr: 'محافظة الجيزة',
    governorateEn: 'Giza Governorate',
    isActive: true,
  });

  await areaRepo.save([
    {
      cityId: giza.id,
      nameAr: 'الدقي',
      nameEn: 'Dokki',
      centerLatitude: 30.0385,
      centerLongitude: 31.2119,
    },
    {
      cityId: giza.id,
      nameAr: 'المهندسين',
      nameEn: 'Mohandessin',
      centerLatitude: 30.0558,
      centerLongitude: 31.2033,
    },
    {
      cityId: giza.id,
      nameAr: 'السادس من أكتوبر',
      nameEn: '6th of October',
      centerLatitude: 29.9737,
      centerLongitude: 30.9529,
    },
    {
      cityId: giza.id,
      nameAr: 'الشيخ زايد',
      nameEn: 'Sheikh Zayed',
      centerLatitude: 30.0478,
      centerLongitude: 30.9991,
    },
    {
      cityId: giza.id,
      nameAr: 'الهرم',
      nameEn: 'Haram',
      centerLatitude: 29.9961,
      centerLongitude: 31.1444,
    },
  ]);

  // 3. Alexandria (الإسكندرية)
  const alex = await cityRepo.save({
    nameAr: 'الإسكندرية',
    nameEn: 'Alexandria',
    governorateAr: 'محافظة الإسكندرية',
    governorateEn: 'Alexandria Governorate',
    isActive: true,
  });

  await areaRepo.save([
    {
      cityId: alex.id,
      nameAr: 'الشاطبي',
      nameEn: 'Shatby',
      centerLatitude: 31.2131,
      centerLongitude: 29.9192,
    },
    {
      cityId: alex.id,
      nameAr: 'سيدي جابر',
      nameEn: 'Sidi Gaber',
      centerLatitude: 31.2198,
      centerLongitude: 29.9436,
    },
    {
      cityId: alex.id,
      nameAr: 'سموحة',
      nameEn: 'Smouha',
      centerLatitude: 31.2045,
      centerLongitude: 29.9547,
    },
  ]);
};
```

---

### 3.2 Seeder 02: `02-universities.seed.ts`

Initializes universities with verified main campus coordinates:

```typescript
export const seedUniversities = async (dataSource: DataSource) => {
  const uniRepo = dataSource.getRepository(University);
  const cityRepo = dataSource.getRepository(City);

  const cairo = await cityRepo.findOneByOrFail({ nameEn: 'Cairo' });
  const giza = await cityRepo.findOneByOrFail({ nameEn: 'Giza' });

  await uniRepo.save([
    {
      nameAr: 'جامعة القاهرة',
      nameEn: 'Cairo University',
      cityId: giza.id,
      mainCampusLatitude: 30.0276,
      mainCampusLongitude: 31.2101,
      websiteUrl: 'https://cu.edu.eg',
      isActive: true,
    },
    {
      nameAr: 'جامعة عين شمس',
      nameEn: 'Ain Shams University',
      cityId: cairo.id,
      mainCampusLatitude: 30.0768,
      mainCampusLongitude: 31.2853,
      websiteUrl: 'https://asu.edu.eg',
      isActive: true,
    },
    {
      nameAr: 'جامعة حلوان',
      nameEn: 'Helwan University',
      cityId: cairo.id,
      mainCampusLatitude: 29.8668,
      mainCampusLongitude: 31.3204,
      websiteUrl: 'https://helwan.edu.eg',
      isActive: true,
    },
    {
      nameAr: 'الجامعة الألمانية بالقاهرة',
      nameEn: 'German University in Cairo (GUC)',
      cityId: cairo.id,
      mainCampusLatitude: 29.9869,
      mainCampusLongitude: 31.4414,
      websiteUrl: 'https://www.guc.edu.eg',
      isActive: true,
    },
    {
      nameAr: 'الجامعة الأمريكية بالقاهرة',
      nameEn: 'The American University in Cairo (AUC)',
      cityId: cairo.id,
      mainCampusLatitude: 30.0198,
      mainCampusLongitude: 31.5,
      websiteUrl: 'https://www.aucegypt.edu',
      isActive: true,
    },
  ]);
};
```

---

### 3.3 Seeder 03: `03-platform-settings.seed.ts`

Establishes default operational settings:

```typescript
export const seedPlatformSettings = async (dataSource: DataSource) => {
  const settingRepo = dataSource.getRepository(PlatformSetting);

  await settingRepo.save([
    {
      key: 'pilot_free_listing_limit',
      value: { limit: 5 },
      description: 'Maximum number of free active property listings per provider during pilot',
      isPublic: false,
    },
    {
      key: 'max_open_requests_per_student',
      value: { limit: 3 },
      description: 'Maximum concurrent open (PENDING or ACCEPTED) booking requests per student',
      isPublic: true,
    },
    {
      key: 'otp_expiry_minutes',
      value: { minutes: 5 },
      description: 'Expiration duration for SMS OTP verification codes',
      isPublic: true,
    },
    {
      key: 'contact_disclosure_policy',
      value: { immediateUponRequest: true },
      description: 'Directly reveal phone number and email when booking request is submitted',
      isPublic: true,
    },
  ]);
};
```

---

### 3.4 Seeder 04: `04-initial-superadmin.seed.ts`

Satisfies invariant `BR-ADM-001` (Single seeded superadmin; no public admin registration):

```typescript
import * as bcrypt from 'bcrypt';

export const seedInitialSuperadmin = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository(User);

  // Check if an ADMIN user already exists in the database
  const existingAdmin = await userRepo.findOne({ where: { role: 'ADMIN' } });
  if (existingAdmin) {
    console.log('[Seed] Superadmin account already exists. Skipping.');
    return;
  }

  const phone = process.env.ADMIN_PHONE || '+201000000000';
  const email = process.env.ADMIN_EMAIL || 'admin@sakany.eg';
  const rawPassword = process.env.ADMIN_PASSWORD || 'SakanyAdmin2026!Secure';

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  const adminUser = userRepo.create({
    phone,
    email,
    passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    isPhoneVerified: true,
    phoneVerifiedAt: new Date(),
  });

  await userRepo.save(adminUser);
  console.log(`[Seed] Initial superadmin created successfully: ${phone} / ${email}`);
};
```

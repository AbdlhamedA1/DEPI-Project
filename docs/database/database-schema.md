# PostgreSQL Physical Database Schema Specification

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب)
- **Specification Document**: Phase 3 Technical Design & Database Architecture
- **Document Path**: `docs/database/database-schema.md`
- **Target Engine**: PostgreSQL 16+
- **Extensions**: `uuid-ossp`, `cube`, `earthdistance`

---

## 1. Engine & Schema Standards

### Database Conventions:

- **Identifier Naming**: Snake case (`snake_case`) for all table and column names.
- **Primary Keys**: Universal UUID v4 generated via `gen_random_uuid()` or `uuid_generate_v4()`.
- **Temporal Defaults**: Timestamps use `TIMESTAMPTZ` with default `clock_timestamp()` for precise monotonic recording.
- **Geographic Modeling**: Coordinates stored as `NUMERIC(10, 7)` with spherical calculations enabled by the PostgreSQL `cube` and `earthdistance` extensions.
- **Currency & Pricing**: Currency amounts stored as `NUMERIC(10, 2)` representing Egyptian Pounds (EGP).

```sql
-- Extensions Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
```

---

## 2. Table-by-Table Specifications & DDL Scripts

### Aggregate 1: Identity & User Access

#### 1. Table: `users`

System-wide authentication principal supporting student phone-based OTP authentication, owner email/phone authentication, and administrative accounts.

| Column              | Type         | Nullable | Default / Constraints                                                     | Description                              |
| ------------------- | ------------ | -------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| `id`                | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                     | Unique user identifier                   |
| `phone`             | VARCHAR(20)  | NO       | UNIQUE                                                                    | E.164 Egyptian mobile number (`+201...`) |
| `email`             | VARCHAR(255) | YES      | UNIQUE                                                                    | Unique normalized email address          |
| `password_hash`     | VARCHAR(255) | YES      |                                                                           | Nullable for students logging in via OTP |
| `role`              | VARCHAR(20)  | NO       | CHECK (role IN ('STUDENT', 'OWNER', 'ADMIN'))                             | Access control role                      |
| `status`            | VARCHAR(20)  | NO       | DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')) | Account lifecycle state                  |
| `is_phone_verified` | BOOLEAN      | NO       | DEFAULT false                                                             | Phone OTP verification flag              |
| `phone_verified_at` | TIMESTAMPTZ  | YES      |                                                                           | Verification completion timestamp        |
| `last_login_at`     | TIMESTAMPTZ  | YES      |                                                                           | Last authenticated session timestamp     |
| `created_at`        | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                 | Creation timestamp                       |
| `updated_at`        | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                 | Last update timestamp                    |

```sql
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
```

---

#### 2. Table: `student_profiles`

Profile entity extending `users` for student tenants. Captures academic institution affiliation and gender matching criteria.

| Column                      | Type         | Nullable | Default / Constraints                          | Description                               |
| --------------------------- | ------------ | -------- | ---------------------------------------------- | ----------------------------------------- |
| `id`                        | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()          | Profile primary key                       |
| `user_id`                   | UUID         | NO       | UNIQUE REFERENCES users(id) ON DELETE CASCADE  | Associated user ID                        |
| `full_name`                 | VARCHAR(150) | NO       |                                                | Legal full name in Arabic/English         |
| `university_id`             | UUID         | NO       | REFERENCES universities(id) ON DELETE RESTRICT | Enrolled university                       |
| `faculty`                   | VARCHAR(100) | YES      |                                                | Faculty or academic college               |
| `academic_year`             | VARCHAR(50)  | YES      |                                                | Current academic year (e.g. "Year 2")     |
| `gender`                    | VARCHAR(10)  | NO       | CHECK (gender IN ('MALE', 'FEMALE'))           | Gender for room segregation policies      |
| `bio`                       | TEXT         | YES      |                                                | Student personal introduction bio         |
| `avatar_url`                | VARCHAR(500) | YES      |                                                | Cloudinary profile image link             |
| `verification_document_url` | VARCHAR(500) | YES      |                                                | Private university ID or enrollment proof |
| `created_at`                | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                      | Record creation timestamp                 |
| `updated_at`                | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                      | Last profile modification                 |

```sql
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
CREATE INDEX idx_student_profiles_gender ON student_profiles (gender);
```

---

#### 3. Table: `property_provider_profiles`

Profile entity extending `users` for accommodation providers (individual owners, authorized brokers, property management companies).

| Column                | Type         | Nullable | Default / Constraints                                                                                 | Description                                      |
| --------------------- | ------------ | -------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `id`                  | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                 | Provider profile ID                              |
| `user_id`             | UUID         | NO       | UNIQUE REFERENCES users(id) ON DELETE CASCADE                                                         | Associated user account                          |
| `provider_type`       | VARCHAR(30)  | NO       | CHECK (provider_type IN ('INDIVIDUAL_OWNER', 'AUTHORIZED_AGENT', 'MANAGEMENT_COMPANY'))               | Legal classification                             |
| `company_name`        | VARCHAR(200) | YES      |                                                                                                       | Registered corporate name if company             |
| `commercial_reg_no`   | VARCHAR(100) | YES      |                                                                                                       | Commercial registry (سجل تجاري)                  |
| `tax_card_no`         | VARCHAR(100) | YES      |                                                                                                       | Tax card number (بطاقة ضريبية)                   |
| `full_name`           | VARCHAR(150) | NO       |                                                                                                       | Legal full name of representative                |
| `national_id_number`  | VARCHAR(20)  | NO       |                                                                                                       | Egyptian 14-digit National ID (strictly private) |
| `verification_status` | VARCHAR(20)  | NO       | DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')) | KYC verification gate                            |
| `verified_at`         | TIMESTAMPTZ  | YES      |                                                                                                       | Timestamp of admin KYC verification              |
| `rejection_reason`    | TEXT         | YES      |                                                                                                       | Administrator explanation if rejected            |
| `bio`                 | TEXT         | YES      |                                                                                                       | Public provider description                      |
| `avatar_url`          | VARCHAR(500) | YES      |                                                                                                       | Public logo or headshot image URL                |
| `created_at`          | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                                             | Creation timestamp                               |
| `updated_at`          | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                                             | Last profile modification                        |

```sql
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
CREATE INDEX idx_provider_profiles_type ON property_provider_profiles (provider_type);
```

---

#### 4. Table: `property_verifications`

Document verification records submitted by property providers for KYC and listing ownership compliance.

| Column                | Type         | Nullable | Default / Constraints                                                                                              | Description                         |
| --------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `id`                  | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                              | Document record ID                  |
| `provider_id`         | UUID         | NO       | REFERENCES property_provider_profiles(id) ON DELETE CASCADE                                                        | Submitting provider                 |
| `property_id`         | UUID         | YES      | REFERENCES properties(id) ON DELETE CASCADE                                                                        | Associated property if deed/permit  |
| `document_type`       | VARCHAR(50)  | NO       | CHECK (document_type IN ('NATIONAL_ID', 'OWNERSHIP_DEED', 'POWER_OF_ATTORNEY', 'COMMERCIAL_REGISTRY', 'TAX_CARD')) | Document category                   |
| `file_url`            | VARCHAR(500) | NO       |                                                                                                                    | Private cloud storage URL           |
| `document_ref_no`     | VARCHAR(100) | YES      |                                                                                                                    | Official government document serial |
| `verification_status` | VARCHAR(20)  | NO       | DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'))                               | Verification outcome                |
| `reviewed_by`         | UUID         | YES      | REFERENCES users(id) ON DELETE SET NULL                                                                            | Admin user ID who reviewed file     |
| `reviewed_at`         | TIMESTAMPTZ  | YES      |                                                                                                                    | Review decision timestamp           |
| `admin_note`          | TEXT         | YES      |                                                                                                                    | Private administrative review notes |
| `created_at`          | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                                                          | Upload timestamp                    |
| `updated_at`          | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                                                                          | Last modification timestamp         |

```sql
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

CREATE INDEX idx_verifications_provider_status ON property_verifications (provider_id, verification_status);
CREATE INDEX idx_verifications_property_id ON property_verifications (property_id) WHERE property_id IS NOT NULL;
```

---

### Aggregate 2: Geography & Academic Directory

#### 5. Table: `cities`

Egyptian governorates / major urban cities.

| Column           | Type         | Nullable | Default / Constraints                 | Description                          |
| ---------------- | ------------ | -------- | ------------------------------------- | ------------------------------------ |
| `id`             | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid() | City ID                              |
| `name_ar`        | VARCHAR(100) | NO       | UNIQUE                                | City name in Arabic (e.g. "القاهرة") |
| `name_en`        | VARCHAR(100) | NO       | UNIQUE                                | City name in English (e.g. "Cairo")  |
| `governorate_ar` | VARCHAR(100) | NO       |                                       | Egyptian Governorate in Arabic       |
| `governorate_en` | VARCHAR(100) | NO       |                                       | Egyptian Governorate in English      |
| `is_active`      | BOOLEAN      | NO       | DEFAULT true                          | Platform operation status            |
| `created_at`     | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()             | Creation timestamp                   |
| `updated_at`     | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()             | Last update timestamp                |

```sql
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

CREATE INDEX idx_cities_name_en ON cities (name_en);
CREATE INDEX idx_cities_is_active ON cities (is_active);
```

---

#### 6. Table: `areas`

Neighborhoods and districts within an Egyptian city.

| Column             | Type           | Nullable | Default / Constraints                   | Description                            |
| ------------------ | -------------- | -------- | --------------------------------------- | -------------------------------------- |
| `id`               | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()   | Area ID                                |
| `city_id`          | UUID           | NO       | REFERENCES cities(id) ON DELETE CASCADE | Parent city reference                  |
| `name_ar`          | VARCHAR(100)   | NO       |                                         | Neighborhood in Arabic (e.g. "الدقي")  |
| `name_en`          | VARCHAR(100)   | NO       |                                         | Neighborhood in English (e.g. "Dokki") |
| `center_latitude`  | NUMERIC(10, 7) | YES      |                                         | Geometric center latitude              |
| `center_longitude` | NUMERIC(10, 7) | YES      |                                         | Geometric center longitude             |
| `is_active`        | BOOLEAN        | NO       | DEFAULT true                            | Platform active status                 |
| `created_at`       | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()               | Creation timestamp                     |
| `updated_at`       | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()               | Last update timestamp                  |

```sql
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

CREATE INDEX idx_areas_city_id ON areas (city_id);
CREATE UNIQUE INDEX idx_areas_city_name ON areas (city_id, name_en);
```

---

#### 7. Table: `universities`

Higher education institutions with verified geographic coordinates of their main student campus gates.

| Column                  | Type           | Nullable | Default / Constraints                    | Description                    |
| ----------------------- | -------------- | -------- | ---------------------------------------- | ------------------------------ |
| `id`                    | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()    | University ID                  |
| `name_ar`               | VARCHAR(150)   | NO       | UNIQUE                                   | University name in Arabic      |
| `name_en`               | VARCHAR(150)   | NO       | UNIQUE                                   | University name in English     |
| `city_id`               | UUID           | NO       | REFERENCES cities(id) ON DELETE RESTRICT | Main campus city               |
| `area_id`               | UUID           | YES      | REFERENCES areas(id) ON DELETE SET NULL  | District/neighborhood          |
| `main_campus_latitude`  | NUMERIC(10, 7) | NO       |                                          | Campus main gate GPS latitude  |
| `main_campus_longitude` | NUMERIC(10, 7) | NO       |                                          | Campus main gate GPS longitude |
| `website_url`           | VARCHAR(255)   | YES      |                                          | Official university website    |
| `is_active`             | BOOLEAN        | NO       | DEFAULT true                             | Directory active status        |
| `created_at`            | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                | Creation timestamp             |
| `updated_at`            | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                | Last update timestamp          |

```sql
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

CREATE INDEX idx_universities_city_id ON universities (city_id);
CREATE INDEX idx_universities_coords ON universities (main_campus_latitude, main_campus_longitude);
```

---

### Aggregate 3: Accommodation Inventory Hierarchy

#### 8. Table: `properties`

Top-level residential listing (entire building, residential complex, or standalone apartment asset).

| Column                      | Type           | Nullable | Default / Constraints                                                                                       | Description                             |
| --------------------------- | -------------- | -------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `id`                        | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                       | Property ID                             |
| `owner_id`                  | UUID           | NO       | REFERENCES property_provider_profiles(id) ON DELETE CASCADE                                                 | Managing provider profile               |
| `title_ar`                  | VARCHAR(200)   | NO       |                                                                                                             | Arabic listing headline                 |
| `title_en`                  | VARCHAR(200)   | NO       |                                                                                                             | English listing headline                |
| `description_ar`            | TEXT           | NO       |                                                                                                             | Arabic property description             |
| `description_en`            | TEXT           | NO       |                                                                                                             | English property description            |
| `property_type`             | VARCHAR(30)    | NO       | CHECK (property_type IN ('BUILDING', 'APARTMENT', 'ROOM', 'BED'))                                           | Accommodation typology                  |
| `gender_policy`             | VARCHAR(20)    | NO       | CHECK (gender_policy IN ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED_FAMILY'))                                       | Tenant gender rules                     |
| `city_id`                   | UUID           | NO       | REFERENCES cities(id) ON DELETE RESTRICT                                                                    | Location city                           |
| `area_id`                   | UUID           | NO       | REFERENCES areas(id) ON DELETE RESTRICT                                                                     | Location district                       |
| `street_address`            | VARCHAR(255)   | NO       |                                                                                                             | Full street address                     |
| `building_number`           | VARCHAR(50)    | NO       |                                                                                                             | Building identifier                     |
| `floor_number`              | INT            | YES      |                                                                                                             | Floor level                             |
| `latitude`                  | NUMERIC(10, 7) | NO       |                                                                                                             | Exact latitude                          |
| `longitude`                 | NUMERIC(10, 7) | NO       |                                                                                                             | Exact longitude                         |
| `google_place_id`           | VARCHAR(255)   | YES      |                                                                                                             | Google Maps Place ID                    |
| `nearest_university_id`     | UUID           | YES      | REFERENCES universities(id) ON DELETE SET NULL                                                              | Nearest campus reference                |
| `distance_to_university_km` | NUMERIC(6, 2)  | YES      |                                                                                                             | Geodesic distance in kilometers         |
| `amenities`                 | TEXT[]         | NO       | DEFAULT '{}'                                                                                                | Amenities array (Wi-Fi, Elevator, etc.) |
| `rules`                     | TEXT[]         | NO       | DEFAULT '{}'                                                                                                | House rules array                       |
| `approval_status`           | VARCHAR(20)    | NO       | DEFAULT 'PENDING_REVIEW' CHECK (approval_status IN ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED')) | Moderation status                       |
| `moderation_note`           | TEXT           | YES      |                                                                                                             | Admin feedback if rejected              |
| `published_at`              | TIMESTAMPTZ    | YES      |                                                                                                             | Timestamp of moderation approval        |
| `created_at`                | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                                                   | Listing creation timestamp              |
| `updated_at`                | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                                                   | Last modification timestamp             |

```sql
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

CREATE INDEX idx_properties_owner_id ON properties (owner_id);
CREATE INDEX idx_properties_approval_status ON properties (approval_status);
CREATE INDEX idx_properties_city_area ON properties (city_id, area_id);
CREATE INDEX idx_properties_location_geo ON properties (latitude, longitude);
CREATE INDEX idx_properties_university_dist ON properties (nearest_university_id, distance_to_university_km);
CREATE INDEX idx_properties_gender_policy ON properties (gender_policy);
```

---

#### 9. Table: `property_images`

Image gallery photos stored in Cloudinary and associated with a property listing.

| Column                 | Type         | Nullable | Default / Constraints                       | Description                          |
| ---------------------- | ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `id`                   | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()       | Image ID                             |
| `property_id`          | UUID         | NO       | REFERENCES properties(id) ON DELETE CASCADE | Associated listing                   |
| `cloudinary_public_id` | VARCHAR(255) | NO       |                                             | Cloudinary asset identifier          |
| `image_url`            | VARCHAR(500) | NO       |                                             | Full-resolution Cloudinary image URL |
| `thumbnail_url`        | VARCHAR(500) | NO       |                                             | Transformed thumbnail image URL      |
| `caption`              | VARCHAR(255) | YES      |                                             | Optional photo caption               |
| `is_cover`             | BOOLEAN      | NO       | DEFAULT false                               | Primary cover image flag             |
| `display_order`        | INT          | NO       | DEFAULT 0                                   | Sort order index in gallery          |
| `created_at`           | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                   | Upload timestamp                     |

```sql
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

CREATE INDEX idx_property_images_prop_order ON property_images (property_id, display_order);
CREATE INDEX idx_property_images_cover ON property_images (property_id) WHERE is_cover = true;
```

---

#### 10. Table: `property_units`

Apartment units within a property building.

| Column             | Type          | Nullable | Default / Constraints                                                      | Description                          |
| ------------------ | ------------- | -------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `id`               | UUID          | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                      | Unit primary key                     |
| `property_id`      | UUID          | NO       | REFERENCES properties(id) ON DELETE CASCADE                                | Parent property                      |
| `unit_number`      | VARCHAR(50)   | NO       |                                                                            | Unit code or number (e.g. "Flat 12") |
| `floor_number`     | INT           | NO       |                                                                            | Floor level within building          |
| `total_rooms`      | INT           | NO       | CHECK (total_rooms >= 0)                                                   | Total room count                     |
| `total_bathrooms`  | INT           | NO       | DEFAULT 1 CHECK (total_bathrooms >= 1)                                     | Total bathroom count                 |
| `has_kitchen`      | BOOLEAN       | NO       | DEFAULT true                                                               | Private unit kitchen flag            |
| `has_living_room`  | BOOLEAN       | NO       | DEFAULT true                                                               | Common living lounge flag            |
| `has_balcony`      | BOOLEAN       | NO       | DEFAULT false                                                              | Private terrace or balcony           |
| `size_sqm`         | NUMERIC(6, 2) | YES      |                                                                            | Total floor area in square meters    |
| `furnished_status` | VARCHAR(20)   | NO       | CHECK (furnished_status IN ('FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED')) | Furnishing level                     |
| `is_published`     | BOOLEAN       | NO       | DEFAULT true                                                               | Active booking flag                  |
| `created_at`       | TIMESTAMPTZ   | NO       | DEFAULT clock_timestamp()                                                  | Creation timestamp                   |
| `updated_at`       | TIMESTAMPTZ   | NO       | DEFAULT clock_timestamp()                                                  | Last update timestamp                |

```sql
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

CREATE INDEX idx_property_units_property_id ON property_units (property_id);
CREATE UNIQUE INDEX idx_property_units_unique_num ON property_units (property_id, unit_number);
```

---

#### 11. Table: `rooms`

Individual private or shared bedrooms within an apartment unit.

| Column                 | Type          | Nullable | Default / Constraints                           | Description                          |
| ---------------------- | ------------- | -------- | ----------------------------------------------- | ------------------------------------ |
| `id`                   | UUID          | NO       | PRIMARY KEY DEFAULT gen_random_uuid()           | Room primary key                     |
| `unit_id`              | UUID          | NO       | REFERENCES property_units(id) ON DELETE CASCADE | Parent apartment unit                |
| `room_number`          | VARCHAR(50)   | NO       |                                                 | Room name/identifier (e.g. "Room A") |
| `room_type`            | VARCHAR(20)   | NO       | CHECK (room_type IN ('PRIVATE', 'SHARED'))      | Room layout configuration            |
| `capacity`             | INT           | NO       | DEFAULT 1 CHECK (capacity >= 1)                 | Maximum occupant capacity            |
| `has_private_bathroom` | BOOLEAN       | NO       | DEFAULT false                                   | Ensuite bathroom amenity             |
| `has_balcony`          | BOOLEAN       | NO       | DEFAULT false                                   | Attached private balcony             |
| `has_air_conditioning` | BOOLEAN       | NO       | DEFAULT false                                   | Air conditioning amenity             |
| `size_sqm`             | NUMERIC(6, 2) | YES      |                                                 | Room surface area in m²              |
| `is_published`         | BOOLEAN       | NO       | DEFAULT true                                    | Independent listing flag             |
| `created_at`           | TIMESTAMPTZ   | NO       | DEFAULT clock_timestamp()                       | Creation timestamp                   |
| `updated_at`           | TIMESTAMPTZ   | NO       | DEFAULT clock_timestamp()                       | Last update timestamp                |

```sql
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

CREATE INDEX idx_rooms_unit_id ON rooms (unit_id);
CREATE INDEX idx_rooms_type_capacity ON rooms (room_type, capacity);
```

---

#### 12. Table: `beds`

Individual sleeping spots within a shared room.

| Column         | Type        | Nullable | Default / Constraints                                     | Description                          |
| -------------- | ----------- | -------- | --------------------------------------------------------- | ------------------------------------ |
| `id`           | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                     | Bed primary key                      |
| `room_id`      | UUID        | NO       | REFERENCES rooms(id) ON DELETE CASCADE                    | Parent shared room                   |
| `bed_number`   | VARCHAR(50) | NO       |                                                           | Bed label (e.g. "Bed 1", "Bunk Top") |
| `bed_type`     | VARCHAR(20) | NO       | CHECK (bed_type IN ('SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM')) | Bed frame specification              |
| `is_published` | BOOLEAN     | NO       | DEFAULT true                                              | Independent listing flag             |
| `created_at`   | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                 | Creation timestamp                   |
| `updated_at`   | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                 | Last update timestamp                |

```sql
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    bed_type VARCHAR(20) NOT NULL CHECK (bed_type IN ('SINGLE', 'BUNK_TOP', 'BUNK_BOTTOM')),
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_beds_room_id ON beds (room_id);
CREATE UNIQUE INDEX idx_beds_unique_num ON beds (room_id, bed_number);
```

---

#### 13. Table: `pricings`

Polymorphic pricing structure applicable to any accommodation tier (`PROPERTY`, `UNIT`, `ROOM`, or `BED`).

| Column           | Type           | Nullable | Default / Constraints                                                         | Description                        |
| ---------------- | -------------- | -------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `id`             | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                         | Pricing primary key                |
| `entity_type`    | VARCHAR(20)    | NO       | CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED'))                    | Target tier discriminator          |
| `entity_id`      | UUID           | NO       |                                                                               | Target entity foreign record ID    |
| `pricing_unit`   | VARCHAR(20)    | NO       | CHECK (pricing_unit IN ('PER_PERSON', 'PER_BED', 'PER_ROOM', 'PER_UNIT'))     | Unit rate basis                    |
| `duration_unit`  | VARCHAR(20)    | NO       | CHECK (duration_unit IN ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY')) | Billing tenure                     |
| `amount`         | NUMERIC(10, 2) | NO       | CHECK (amount > 0)                                                            | Rent amount in EGP                 |
| `deposit_amount` | NUMERIC(10, 2) | NO       | DEFAULT 0 CHECK (deposit_amount >= 0)                                         | Refundable security deposit in EGP |
| `currency`       | VARCHAR(3)     | NO       | DEFAULT 'EGP'                                                                 | ISO Currency code (EGP)            |
| `is_active`      | BOOLEAN        | NO       | DEFAULT true                                                                  | Active pricing rate flag           |
| `created_at`     | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                     | Creation timestamp                 |
| `updated_at`     | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                     | Last update timestamp              |

```sql
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
CREATE INDEX idx_pricings_amount ON pricings (amount);
```

---

#### 14. Table: `additional_expenses`

Itemized utility and maintenance fees (utilities, cleaning, security, Wi-Fi) billed separately from base rent.

| Column              | Type           | Nullable | Default / Constraints                                                         | Description                            |
| ------------------- | -------------- | -------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| `id`                | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                         | Expense ID                             |
| `property_id`       | UUID           | NO       | REFERENCES properties(id) ON DELETE CASCADE                                   | Associated listing                     |
| `entity_type`       | VARCHAR(20)    | NO       | DEFAULT 'PROPERTY' CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')) | Target tier                            |
| `entity_id`         | UUID           | NO       |                                                                               | Target entity ID                       |
| `name_ar`           | VARCHAR(100)   | NO       |                                                                               | Arabic title (e.g. "الكهرباء والمياه") |
| `name_en`           | VARCHAR(100)   | NO       |                                                                               | English title (e.g. "Utilities")       |
| `amount`            | NUMERIC(10, 2) | NO       | CHECK (amount >= 0)                                                           | Fee amount in EGP                      |
| `is_mandatory`      | BOOLEAN        | NO       | DEFAULT true                                                                  | True = mandatory, False = optional     |
| `is_recurring`      | BOOLEAN        | NO       | DEFAULT true                                                                  | True = recurring, False = one-time     |
| `billing_frequency` | VARCHAR(20)    | YES      | CHECK (billing_frequency IN ('ONE_TIME', 'MONTHLY', 'SEMESTER', 'YEARLY'))    | Frequency of expense billing           |
| `created_at`        | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                     | Creation timestamp                     |
| `updated_at`        | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                     | Last update timestamp                  |

```sql
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

CREATE INDEX idx_expenses_property_id ON additional_expenses (property_id);
CREATE INDEX idx_expenses_target ON additional_expenses (entity_type, entity_id);
```

---

#### 15. Table: `availabilities`

Polymorphic availability tracking engine supporting optimistic concurrency versioning and row-level locking.

| Column                       | Type        | Nullable | Default / Constraints                                                                                   | Description                      |
| ---------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `id`                         | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                   | Record ID                        |
| `entity_type`                | VARCHAR(20) | NO       | CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED'))                                              | Target tier discriminator        |
| `entity_id`                  | UUID        | NO       |                                                                                                         | Target entity foreign ID         |
| `status`                     | VARCHAR(20) | NO       | DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED', 'MAINTENANCE', 'UNAVAILABLE')) | Current availability state       |
| `available_from`             | DATE        | NO       | DEFAULT CURRENT_DATE                                                                                    | Earliest move-in date            |
| `available_to`               | DATE        | YES      |                                                                                                         | Latest date (null = indefinite)  |
| `current_booking_request_id` | UUID        | YES      |                                                                                                         | Active confirmed booking pointer |
| `version`                    | INT         | NO       | DEFAULT 1                                                                                               | Optimistic concurrency version   |
| `updated_at`                 | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                                               | Concurrency lock timestamp       |

```sql
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
```

---

### Aggregate 4: Booking & Legal Agreements

#### 16. Table: `booking_requests`

Formal booking application submitted by a student targeting a specific bookable accommodation tier.

| Column                   | Type        | Nullable | Default / Constraints                                                                                                | Description                   |
| ------------------------ | ----------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `id`                     | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                                | Request ID                    |
| `student_id`             | UUID        | NO       | REFERENCES student_profiles(id) ON DELETE RESTRICT                                                                   | Initiating student            |
| `property_id`            | UUID        | NO       | REFERENCES properties(id) ON DELETE RESTRICT                                                                         | Listing target                |
| `target_entity_type`     | VARCHAR(20) | NO       | CHECK (target_entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED'))                                                    | Exact accommodation tier      |
| `target_entity_id`       | UUID        | NO       |                                                                                                                      | Exact tier record ID          |
| `status`                 | VARCHAR(20) | NO       | DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'CLOSED_CONFLICT')) | Request lifecycle state       |
| `requested_move_in_date` | DATE        | NO       |                                                                                                                      | Intended move-in date         |
| `duration_unit`          | VARCHAR(20) | NO       | CHECK (duration_unit IN ('DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY'))                                        | Duration unit                 |
| `duration_count`         | INT         | NO       | DEFAULT 1 CHECK (duration_count >= 1)                                                                                | Number of duration units      |
| `student_note`           | TEXT        | YES      |                                                                                                                      | Personal note to owner        |
| `rejection_reason`       | TEXT        | YES      |                                                                                                                      | Optional owner rejection note |
| `cancelled_at`           | TIMESTAMPTZ | YES      |                                                                                                                      | Cancellation timestamp        |
| `cancelled_by`           | VARCHAR(20) | YES      | CHECK (cancelled_by IN ('STUDENT', 'SYSTEM'))                                                                        | Cancellation source           |
| `cancellation_reason`    | TEXT        | YES      |                                                                                                                      | Private cancellation note     |
| `created_at`             | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                                                            | Submission timestamp          |
| `updated_at`             | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                                                            | Last modification timestamp   |

```sql
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

CREATE INDEX idx_booking_requests_student_status ON booking_requests (student_id, status);
CREATE INDEX idx_booking_requests_property_id ON booking_requests (property_id);
CREATE INDEX idx_booking_requests_target ON booking_requests (target_entity_type, target_entity_id, status);
```

---

#### 17. Table: `agreement_confirmations`

Bilateral confirmation state machine tracking mutual student and owner consent to complete rental booking.

| Column                 | Type           | Nullable | Default / Constraints                                                                                                             | Description                      |
| ---------------------- | -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `id`                   | UUID           | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                                             | Agreement ID                     |
| `booking_request_id`   | UUID           | NO       | UNIQUE REFERENCES booking_requests(id) ON DELETE RESTRICT                                                                         | 1:1 linked booking request       |
| `status`               | VARCHAR(20)    | NO       | DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'STUDENT_APPROVED', 'OWNER_APPROVED', 'CONFIRMED', 'CANCELLED')) | Bilateral state                  |
| `student_confirmed`    | BOOLEAN        | NO       | DEFAULT false                                                                                                                     | Student approval flag            |
| `student_confirmed_at` | TIMESTAMPTZ    | YES      |                                                                                                                                   | Student approval timestamp       |
| `owner_confirmed`      | BOOLEAN        | NO       | DEFAULT false                                                                                                                     | Owner approval flag              |
| `owner_confirmed_at`   | TIMESTAMPTZ    | YES      |                                                                                                                                   | Owner approval timestamp         |
| `confirmed_at`         | TIMESTAMPTZ    | YES      |                                                                                                                                   | Bilateral confirmation timestamp |
| `total_amount_egp`     | NUMERIC(10, 2) | NO       | CHECK (total_amount_egp >= 0)                                                                                                     | Agreed rental sum                |
| `deposit_amount_egp`   | NUMERIC(10, 2) | NO       | DEFAULT 0                                                                                                                         | Agreed deposit                   |
| `terms_accepted`       | BOOLEAN        | NO       | DEFAULT true                                                                                                                      | Platform terms acceptance        |
| `created_at`           | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                                                                         | Creation timestamp               |
| `updated_at`           | TIMESTAMPTZ    | NO       | DEFAULT clock_timestamp()                                                                                                         | Last modification timestamp      |

```sql
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

CREATE UNIQUE INDEX idx_agreements_booking_id ON agreement_confirmations (booking_request_id);
CREATE INDEX idx_agreements_status ON agreement_confirmations (status);
```

---

#### 18. Table: `agreement_documents`

Private contract scans or signed agreements uploaded by either party to a confirmed agreement.

| Column                      | Type         | Nullable | Default / Constraints                                    | Description                      |
| --------------------------- | ------------ | -------- | -------------------------------------------------------- | -------------------------------- |
| `id`                        | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                    | Document primary key             |
| `agreement_confirmation_id` | UUID         | NO       | REFERENCES agreement_confirmations(id) ON DELETE CASCADE | Associated agreement             |
| `uploader_id`               | UUID         | NO       | REFERENCES users(id) ON DELETE RESTRICT                  | Uploading user ID                |
| `file_url`                  | VARCHAR(500) | NO       |                                                          | Private signed cloud storage URL |
| `file_name`                 | VARCHAR(255) | NO       |                                                          | Original filename                |
| `file_size_bytes`           | INT          | NO       |                                                          | File size in bytes               |
| `mime_type`                 | VARCHAR(100) | NO       |                                                          | File MIME type                   |
| `created_at`                | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()                                | Upload timestamp                 |

```sql
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

CREATE INDEX idx_agreement_docs_agreement_id ON agreement_documents (agreement_confirmation_id);
```

---

### Aggregate 5: Communication & Trust

#### 19. Table: `conversations`

Direct 1:1 text-only messaging thread bound to a booking request. Remains active permanently.

| Column               | Type        | Nullable | Default / Constraints                                        | Description                 |
| -------------------- | ----------- | -------- | ------------------------------------------------------------ | --------------------------- |
| `id`                 | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                        | Conversation thread ID      |
| `booking_request_id` | UUID        | NO       | UNIQUE REFERENCES booking_requests(id) ON DELETE RESTRICT    | 1:1 linked request          |
| `student_id`         | UUID        | NO       | REFERENCES student_profiles(id) ON DELETE RESTRICT           | Student participant         |
| `owner_id`           | UUID        | NO       | REFERENCES property_provider_profiles(id) ON DELETE RESTRICT | Provider participant        |
| `property_id`        | UUID        | NO       | REFERENCES properties(id) ON DELETE RESTRICT                 | Subject property            |
| `is_active`          | BOOLEAN     | NO       | DEFAULT true                                                 | Permanent active indicator  |
| `last_message_at`    | TIMESTAMPTZ | YES      |                                                              | Timestamp of latest message |
| `created_at`         | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                    | Creation timestamp          |
| `updated_at`         | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                    | Last modification timestamp |

```sql
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

CREATE UNIQUE INDEX idx_conversations_booking_id ON conversations (booking_request_id);
CREATE INDEX idx_conversations_student ON conversations (student_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_owner ON conversations (owner_id, last_message_at DESC NULLS LAST);
```

---

#### 20. Table: `messages`

Individual text-only message payload exchanged inside a conversation thread.

| Column            | Type        | Nullable | Default / Constraints                          | Description               |
| ----------------- | ----------- | -------- | ---------------------------------------------- | ------------------------- |
| `id`              | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()          | Message ID                |
| `conversation_id` | UUID        | NO       | REFERENCES conversations(id) ON DELETE CASCADE | Parent thread             |
| `sender_id`       | UUID        | NO       | REFERENCES users(id) ON DELETE RESTRICT        | Sender user ID            |
| `body`            | TEXT        | NO       |                                                | Text-only message payload |
| `is_read`         | BOOLEAN     | NO       | DEFAULT false                                  | Read indicator            |
| `read_at`         | TIMESTAMPTZ | YES      |                                                | Read receipt timestamp    |
| `created_at`      | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                      | Dispatch timestamp        |

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_messages_conversation_time ON messages (conversation_id, created_at ASC);
CREATE INDEX idx_messages_unread ON messages (conversation_id, is_read) WHERE is_read = false;
```

---

#### 21. Table: `notifications`

In-app and push notification log with bilingual titles and payloads.

| Column       | Type         | Nullable | Default / Constraints                  | Description                       |
| ------------ | ------------ | -------- | -------------------------------------- | --------------------------------- |
| `id`         | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()  | Notification ID                   |
| `user_id`    | UUID         | NO       | REFERENCES users(id) ON DELETE CASCADE | Recipient user                    |
| `type`       | VARCHAR(50)  | NO       |                                        | Notification event classification |
| `title_ar`   | VARCHAR(200) | NO       |                                        | Arabic notification title         |
| `title_en`   | VARCHAR(200) | NO       |                                        | English notification title        |
| `body_ar`    | TEXT         | NO       |                                        | Arabic message body               |
| `body_en`    | TEXT         | NO       |                                        | English message body              |
| `data`       | JSONB        | NO       | DEFAULT '{}'                           | Metadata (links, resource IDs)    |
| `is_read`    | BOOLEAN      | NO       | DEFAULT false                          | Read state                        |
| `read_at`    | TIMESTAMPTZ  | YES      |                                        | Read timestamp                    |
| `created_at` | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()              | Dispatch timestamp                |

```sql
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

CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);
```

---

#### 22. Table: `reviews`

Post-booking ratings (1 to 5 stars) and feedback. Requires completed confirmed booking.

| Column               | Type        | Nullable | Default / Constraints                                                     | Description                 |
| -------------------- | ----------- | -------- | ------------------------------------------------------------------------- | --------------------------- |
| `id`                 | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                     | Review ID                   |
| `booking_request_id` | UUID        | NO       | REFERENCES booking_requests(id) ON DELETE RESTRICT                        | Qualifying booking          |
| `property_id`        | UUID        | NO       | REFERENCES properties(id) ON DELETE RESTRICT                              | Property evaluated          |
| `reviewer_id`        | UUID        | NO       | REFERENCES users(id) ON DELETE RESTRICT                                   | Reviewer user ID            |
| `reviewer_role`      | VARCHAR(20) | NO       | CHECK (reviewer_role IN ('STUDENT', 'OWNER'))                             | Role of reviewer            |
| `reviewee_id`        | UUID        | NO       | REFERENCES users(id) ON DELETE RESTRICT                                   | Evaluated party             |
| `rating`             | SMALLINT    | NO       | CHECK (rating BETWEEN 1 AND 5)                                            | Star rating (1 to 5)        |
| `comment`            | TEXT        | YES      |                                                                           | Written feedback            |
| `is_public`          | BOOLEAN     | NO       | DEFAULT true                                                              | Visibility toggle           |
| `status`             | VARCHAR(20) | NO       | DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'FLAGGED', 'REMOVED')) | Moderation state            |
| `created_at`         | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                 | Submission timestamp        |
| `updated_at`         | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                 | Last modification timestamp |

```sql
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

CREATE UNIQUE INDEX idx_reviews_single_submission ON reviews (booking_request_id, reviewer_role);
CREATE INDEX idx_reviews_property_id ON reviews (property_id, status);
CREATE INDEX idx_reviews_reviewee_id ON reviews (reviewee_id);
```

---

#### 23. Table: `review_responses`

Single public reply submitted by the recipient of a review.

| Column          | Type        | Nullable | Default / Constraints                           | Description                 |
| --------------- | ----------- | -------- | ----------------------------------------------- | --------------------------- |
| `id`            | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()           | Response ID                 |
| `review_id`     | UUID        | NO       | UNIQUE REFERENCES reviews(id) ON DELETE CASCADE | Target review               |
| `responder_id`  | UUID        | NO       | REFERENCES users(id) ON DELETE RESTRICT         | Author of response          |
| `response_text` | TEXT        | NO       |                                                 | Written response payload    |
| `is_public`     | BOOLEAN     | NO       | DEFAULT true                                    | Public visibility toggle    |
| `created_at`    | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                       | Creation timestamp          |
| `updated_at`    | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                       | Last modification timestamp |

```sql
CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    response_text TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE UNIQUE INDEX idx_review_responses_review_id ON review_responses (review_id);
```

---

#### 24. Table: `reports`

Formal text-only dispute or complaint ticket filed by a user.

| Column                 | Type        | Nullable | Default / Constraints                                                                                                 | Description                        |
| ---------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `id`                   | UUID        | NO       | PRIMARY KEY DEFAULT gen_random_uuid()                                                                                 | Report ID                          |
| `reporter_id`          | UUID        | NO       | REFERENCES users(id) ON DELETE RESTRICT                                                                               | Submitting user ID                 |
| `reported_user_id`     | UUID        | YES      | REFERENCES users(id) ON DELETE SET NULL                                                                               | Targeted user if user dispute      |
| `reported_property_id` | UUID        | YES      | REFERENCES properties(id) ON DELETE SET NULL                                                                          | Targeted property if listing issue |
| `reported_review_id`   | UUID        | YES      | REFERENCES reviews(id) ON DELETE SET NULL                                                                             | Targeted review if abusive         |
| `category`             | VARCHAR(50) | NO       | CHECK (category IN ('MISLEADING_LISTING', 'FRAUD', 'HARASSMENT', 'SAFETY_CONCERN', 'INAPPROPRIATE_CONTENT', 'OTHER')) | Complaint category                 |
| `details`              | TEXT        | NO       |                                                                                                                       | Written report details             |
| `status`               | VARCHAR(20) | NO       | DEFAULT 'NEW' CHECK (status IN ('NEW', 'UNDER_REVIEW', 'RESPONDED', 'CLOSED'))                                        | Investigation status               |
| `admin_notes`          | TEXT        | YES      |                                                                                                                       | Private investigation log          |
| `resolved_by`          | UUID        | YES      | REFERENCES users(id) ON DELETE SET NULL                                                                               | Resolving admin ID                 |
| `resolved_at`          | TIMESTAMPTZ | YES      |                                                                                                                       | Resolution timestamp               |
| `created_at`           | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                                                             | Creation timestamp                 |
| `updated_at`           | TIMESTAMPTZ | NO       | DEFAULT clock_timestamp()                                                                                             | Last modification timestamp        |

```sql
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

CREATE INDEX idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX idx_reports_reporter ON reports (reporter_id);
CREATE INDEX idx_reports_property ON reports (reported_property_id) WHERE reported_property_id IS NOT NULL;
```

---

### Aggregate 6: Governance & Platform Audit

#### 25. Table: `admin_action_logs`

Append-only, immutable administrative audit log tracking moderation and system mutations.

| Column               | Type         | Nullable | Default / Constraints                   | Description                                      |
| -------------------- | ------------ | -------- | --------------------------------------- | ------------------------------------------------ |
| `id`                 | UUID         | NO       | PRIMARY KEY DEFAULT gen_random_uuid()   | Audit Log ID                                     |
| `admin_id`           | UUID         | NO       | REFERENCES users(id) ON DELETE RESTRICT | Admin executor user ID                           |
| `action`             | VARCHAR(50)  | NO       |                                         | Action name (e.g. `KYC_APPROVE`, `USER_SUSPEND`) |
| `target_entity_type` | VARCHAR(50)  | NO       |                                         | Modified domain entity name                      |
| `target_entity_id`   | UUID         | NO       |                                         | Modified record ID                               |
| `changes_diff`       | JSONB        | NO       |                                         | Structured JSON payload capturing changes        |
| `ip_address`         | VARCHAR(45)  | YES      |                                         | IPv4 or IPv6 client address                      |
| `user_agent`         | VARCHAR(255) | YES      |                                         | Browser user agent string                        |
| `created_at`         | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()               | Immutable audit event timestamp                  |

```sql
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

CREATE INDEX idx_admin_logs_admin_id ON admin_action_logs (admin_id);
CREATE INDEX idx_admin_logs_target ON admin_action_logs (target_entity_type, target_entity_id);
CREATE INDEX idx_admin_logs_action_created ON admin_action_logs (action, created_at DESC);

-- Immutability Rule: Disallow UPDATE and DELETE via Trigger/Rule
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ERR_IMMUTABLE_LOG_MODIFICATION: admin_action_logs records cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_admin_action_logs
BEFORE UPDATE OR DELETE ON admin_action_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
```

---

#### 26. Table: `platform_settings`

Dynamic runtime key-value configuration table.

| Column        | Type         | Nullable | Default / Constraints                   | Description                           |
| ------------- | ------------ | -------- | --------------------------------------- | ------------------------------------- |
| `key`         | VARCHAR(100) | NO       | PRIMARY KEY                             | Configuration key name                |
| `value`       | JSONB        | NO       |                                         | Typed JSON configuration value        |
| `description` | VARCHAR(255) | NO       |                                         | Human-readable explanation of setting |
| `is_public`   | BOOLEAN      | NO       | DEFAULT false                           | Exposed via public settings endpoint  |
| `updated_by`  | UUID         | YES      | REFERENCES users(id) ON DELETE SET NULL | Modifying admin ID                    |
| `updated_at`  | TIMESTAMPTZ  | NO       | DEFAULT clock_timestamp()               | Last configuration change             |

```sql
CREATE TABLE platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

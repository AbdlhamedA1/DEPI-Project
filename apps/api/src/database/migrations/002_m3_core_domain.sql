-- Milestone 3 Core Domain Schema Expansion
-- Version: 002_m3_core_domain.sql

BEGIN;

-- 1. Users table additions
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'UNVERIFIED';

-- 2. Owner profiles additions
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS national_id_number VARCHAR(14);
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS commercial_registration_number VARCHAR(100);
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'UNVERIFIED';
ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 3. OTP records table
CREATE TABLE IF NOT EXISTS otp_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'REGISTRATION',
  attempts INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_records_phone ON otp_records (phone, purpose, expires_at);

-- 4. Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  family_id UUID NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens (family_id);

-- 5. KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  document_ref_no VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON kyc_documents (user_id);

-- 6. Cities Table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(100) NOT NULL UNIQUE,
  name_en VARCHAR(100) NOT NULL UNIQUE,
  governorate_ar VARCHAR(100) NOT NULL,
  governorate_en VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Areas Table
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  center_latitude NUMERIC(10, 7),
  center_longitude NUMERIC(10, 7),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_areas_city_name UNIQUE (city_id, name_en)
);

-- 8. Expand Universities Table
ALTER TABLE universities ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 9. Expand Properties Table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES areas(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_number VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearest_university_id UUID REFERENCES universities(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS distance_to_university_km NUMERIC(6, 2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rules TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 10. Property Images Table
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  caption VARCHAR(255),
  is_cover BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_property_images_prop ON property_images(property_id, display_order);

-- 11. Additional Expenses Table
CREATE TABLE IF NOT EXISTS additional_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL DEFAULT 'PROPERTY',
  entity_id UUID NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('ONE_TIME', 'MONTHLY', 'SEMESTER', 'YEARLY')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON additional_expenses(property_id);

-- 12. Polymorphic Availabilities Table
CREATE TABLE IF NOT EXISTS availabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('PROPERTY', 'UNIT', 'ROOM', 'BED')),
  entity_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'BOOKED', 'MAINTENANCE', 'UNAVAILABLE')),
  available_from DATE NOT NULL DEFAULT CURRENT_DATE,
  available_to DATE,
  current_booking_request_id UUID,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_availabilities_entity UNIQUE (entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_availabilities_status ON availabilities(status);

-- 13. Admin Action Logs Table
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target ON admin_action_logs(target_type, target_id);

COMMIT;

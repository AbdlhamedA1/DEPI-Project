-- Egyptian Student Housing Platform: Initial PostgreSQL Relational Schema
-- Version: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  national_id VARCHAR(14) UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'OWNER', 'ADMIN')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_id_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID,
  faculty VARCHAR(100),
  academic_year INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE')),
  governorate VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Owners Profiles
CREATE TABLE IF NOT EXISTS owner_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider_type VARCHAR(30) NOT NULL,
  company_name VARCHAR(150),
  tax_number VARCHAR(50),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Universities
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar VARCHAR(150) NOT NULL,
  name_en VARCHAR(150) NOT NULL,
  governorate VARCHAR(50) NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  property_type VARCHAR(30) NOT NULL,
  gender_policy VARCHAR(20) NOT NULL CHECK (gender_policy IN ('MALE_ONLY', 'FEMALE_ONLY', 'MIXED_FAMILY')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL',
  governorate VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  district VARCHAR(100) NOT NULL,
  street_address TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Property Units
CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number VARCHAR(20) NOT NULL,
  floor_number INTEGER NOT NULL,
  total_rooms INTEGER NOT NULL DEFAULT 1,
  total_bathrooms INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  capacity_beds INTEGER NOT NULL DEFAULT 1,
  has_balcony BOOLEAN DEFAULT FALSE,
  has_ac BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Beds
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_code VARCHAR(20) NOT NULL,
  availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Pricing
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  amount_egp NUMERIC(10, 2) NOT NULL,
  duration_unit VARCHAR(20) NOT NULL,
  deposit_amount_egp NUMERIC(10, 2) DEFAULT 0,
  bills_included BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Booking Requests
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'PENDING',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Agreements
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  monthly_rent_egp NUMERIC(10, 2) NOT NULL,
  deposit_egp NUMERIC(10, 2) NOT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'PENDING',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(30) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
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
-- Milestone 4: Transactions, Bilateral Agreements, Messaging, Notifications, Reviews & Reports
-- Migration: 003_m4_transactions_messaging_reviews.sql

BEGIN;

-- 1. Enrich booking_requests table with portion targeting, financial, and audit fields
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pricing_unit VARCHAR(20) DEFAULT 'PER_ROOM',
  ADD COLUMN IF NOT EXISTS duration_unit VARCHAR(20) DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS agreed_price NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_booking_requests_student ON booking_requests (student_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_owner ON booking_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests (status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_target ON booking_requests (target_type, target_id);

-- 2. Enrich agreements table for bilateral confirmation and terms
ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS student_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS student_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS owner_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contract_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_agreements_booking ON agreements (booking_request_id);

-- 3. Agreement Documents table
CREATE TABLE IF NOT EXISTS agreement_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreement_documents_agreement ON agreement_documents (agreement_id);

-- 4. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID UNIQUE REFERENCES booking_requests(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  property_id UUID REFERENCES properties(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_message_at TIMESTAMPTZ,
  unread_count_student INT NOT NULL DEFAULT 0,
  unread_count_owner INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_booking ON conversations (booking_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations (student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations (owner_id);

-- 5. Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachment_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (conversation_id, is_read);

-- 6. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  title_en VARCHAR(200) NOT NULL,
  body_ar TEXT NOT NULL,
  body_en TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- 7. Enrich reviews table with booking_request_id, sub-ratings, and unique submission constraint
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS booking_request_id UUID REFERENCES booking_requests(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS reviewer_role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cleanliness_rating SMALLINT CHECK (cleanliness_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS location_rating SMALLINT CHECK (location_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS value_rating SMALLINT CHECK (value_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS owner_rating SMALLINT CHECK (owner_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_reviewer 
  ON reviews (booking_request_id, student_id) 
  WHERE booking_request_id IS NOT NULL;

-- 8. Review Responses table for single provider rebuttal
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  response_text TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses (review_id);

-- 9. Enrich reports table for progressive moderation and target linking
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reported_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reported_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS evidence_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'NEW';
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);

COMMIT;
-- Milestone 5: Admin Portal, Immutable Audit Trail & Analytics Engine
-- Migration: 004_m5_admin_audit_analytics.sql

BEGIN;

-- 1. Enrich admin_action_logs with client context (IP address, User Agent)
ALTER TABLE admin_action_logs
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255);

-- 2. Audit Log Performance & Inspection Indices
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_action_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_created ON admin_action_logs (action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_created ON admin_action_logs (target_type, target_id, created_at DESC);

-- 3. Immutability Trigger Guard (BR-ADM-002)
-- Prevents UPDATE or DELETE queries on admin_action_logs, enforcing write-only audit trail
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ERR_IMMUTABLE_LOG_MODIFICATION: Admin action logs are immutable and cannot be updated or deleted.'
    USING ERRCODE = '23505';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_admin_action_logs ON admin_action_logs;
CREATE TRIGGER trg_protect_admin_action_logs
BEFORE UPDATE OR DELETE ON admin_action_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

-- 4. Analytical Aggregation & Operational Indices
CREATE INDEX IF NOT EXISTS idx_properties_city_status ON properties (city_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_univ_status ON properties (nearest_university_id, status);
CREATE INDEX IF NOT EXISTS idx_pricing_target ON pricing (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_status ON booking_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_agreements_status_created ON agreements (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_rating_status ON reviews (rating, status);

COMMIT;

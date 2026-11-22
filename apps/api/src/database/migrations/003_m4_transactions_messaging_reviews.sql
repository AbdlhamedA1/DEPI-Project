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

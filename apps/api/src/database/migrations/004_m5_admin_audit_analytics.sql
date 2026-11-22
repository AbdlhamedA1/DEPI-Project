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

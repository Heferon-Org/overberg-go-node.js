-- Phase 7: Add FCM token column and email preferences to profiles
-- Supports push notifications, SMS, and email channels

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fcm_token text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT true;

-- Index for quick token lookup during push sends
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token
  ON profiles (id) WHERE fcm_token IS NOT NULL;

COMMENT ON COLUMN profiles.fcm_token IS 'Firebase Cloud Messaging device token for web push';
COMMENT ON COLUMN profiles.email_notifications IS 'User preference: receive transactional emails';
COMMENT ON COLUMN profiles.sms_notifications IS 'User preference: receive SMS notifications';
COMMENT ON COLUMN profiles.push_notifications IS 'User preference: receive push notifications';

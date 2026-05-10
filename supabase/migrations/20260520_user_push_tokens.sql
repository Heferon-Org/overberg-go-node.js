-- Native push token storage for Capacitor iOS/Android apps
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all push tokens"
  ON user_push_tokens
  FOR SELECT
  TO service_role
  USING (true);

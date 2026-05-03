-- Phase 10: WhatsApp conversations table for AI ordering agent

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_phone text NOT NULL,
  customer_name text,
  user_id uuid REFERENCES profiles(id),
  intent_state text DEFAULT 'greeting',
  cart_draft jsonb DEFAULT '[]'::jsonb,
  last_message text,
  last_bot_reply text,
  prefill_token text UNIQUE,
  token_used boolean DEFAULT false,
  message_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_token ON whatsapp_conversations(prefill_token) WHERE prefill_token IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_whatsapp_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- RLS
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON whatsapp_conversations
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE whatsapp_conversations IS 'Tracks WhatsApp ordering sessions and AI agent state';

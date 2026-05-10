-- Phase 2 Release 1.2: Home services with bidding marketplace

-- Service request categories
DO $$ BEGIN
  CREATE TYPE service_category AS ENUM (
    'plumber', 'electrician', 'painter', 'gardener',
    'cleaner', 'handyman', 'locksmith', 'pest_control',
    'moving', 'appliance_repair', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service requests: customers post tasks
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category service_category NOT NULL,
  title text NOT NULL,
  description text,
  photos text[] DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  address text,
  budget_min_cents integer NOT NULL DEFAULT 0,
  budget_max_cents integer NOT NULL,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'bidding', 'accepted', 'in_progress', 'completed', 'cancelled')),
  accepted_bid_id uuid,
  bidding_closes_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_requests_customer ON service_requests(customer_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_category ON service_requests(category);
CREATE INDEX idx_service_requests_location ON service_requests(latitude, longitude);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON service_requests FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view open requests"
  ON service_requests FOR SELECT
  USING (status IN ('open', 'bidding'));

CREATE POLICY "Users can create requests"
  ON service_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own requests"
  ON service_requests FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Service role full access"
  ON service_requests FOR ALL
  TO service_role
  USING (true);

-- Service bids: providers bid on requests
CREATE TABLE IF NOT EXISTS service_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES service_requests(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL,
  message text,
  eta_hours integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, provider_id)
);

CREATE INDEX idx_service_bids_request ON service_bids(request_id);
CREATE INDEX idx_service_bids_provider ON service_bids(provider_id);

ALTER TABLE service_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own bids"
  ON service_bids FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Request owners can view bids on their requests"
  ON service_bids FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM service_requests sr WHERE sr.id = request_id AND sr.customer_id = auth.uid()
  ));

CREATE POLICY "Providers can create bids"
  ON service_bids FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own bids"
  ON service_bids FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Service role full access to bids"
  ON service_bids FOR ALL
  TO service_role
  USING (true);

-- Add accepted_bid foreign key after bids table exists
ALTER TABLE service_requests
  ADD CONSTRAINT fk_accepted_bid
  FOREIGN KEY (accepted_bid_id)
  REFERENCES service_bids(id);

-- Accept bid RPC: atomically accepts a bid, rejects others, creates linked order
CREATE OR REPLACE FUNCTION accept_service_bid(
  p_request_id uuid,
  p_bid_id uuid
)
RETURNS json AS $$
DECLARE
  v_request service_requests%ROWTYPE;
  v_bid service_bids%ROWTYPE;
  v_order_id uuid;
BEGIN
  SELECT * INTO v_request FROM service_requests WHERE id = p_request_id;
  IF v_request IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_request.customer_id != auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v_request.status NOT IN ('open', 'bidding') THEN RAISE EXCEPTION 'Request not open'; END IF;

  SELECT * INTO v_bid FROM service_bids WHERE id = p_bid_id AND request_id = p_request_id;
  IF v_bid IS NULL THEN RAISE EXCEPTION 'Bid not found'; END IF;

  -- Accept the winning bid
  UPDATE service_bids SET status = 'accepted' WHERE id = p_bid_id;

  -- Reject all other bids
  UPDATE service_bids SET status = 'rejected'
    WHERE request_id = p_request_id AND id != p_bid_id AND status = 'pending';

  -- Update request status
  UPDATE service_requests SET
    status = 'accepted',
    accepted_bid_id = p_bid_id,
    updated_at = now()
  WHERE id = p_request_id;

  -- Create linked order
  INSERT INTO orders (
    customer_id, driver_id, order_number, items,
    subtotal, delivery_fee, service_fee, total,
    status, service_type, service_payload,
    dispatch_status, payment_status
  ) VALUES (
    v_request.customer_id,
    v_bid.provider_id,
    'HS' || upper(to_hex(extract(epoch from now())::bigint)),
    jsonb_build_array(jsonb_build_object(
      'id', v_request.id::text,
      'name', v_request.title,
      'price', v_bid.amount_cents / 100.0,
      'quantity', 1,
      'emoji', '🔧'
    )),
    v_bid.amount_cents / 100.0,
    0, 0,
    v_bid.amount_cents / 100.0,
    'confirmed',
    'home_service',
    jsonb_build_object(
      'request_id', v_request.id,
      'bid_id', v_bid.id,
      'category', v_request.category,
      'provider_id', v_bid.provider_id,
      'address', v_request.address,
      'description', v_request.description
    ),
    'assigned',
    'pending'
  ) RETURNING id INTO v_order_id;

  RETURN json_build_object('ok', true, 'order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add 'provider' role to profiles
ALTER TABLE profiles
  ALTER COLUMN role TYPE text;

-- Auto-update trigger for service_requests
CREATE OR REPLACE FUNCTION update_service_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_requests_updated
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_service_request_timestamp();

-- Enable Realtime for bidding tables
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE service_bids;

-- Phase 2 Release 1.1: Generalize restaurants → merchants, orders gains service_type
-- Backwards-compatible: existing food code keeps working via restaurants view

-- Merchant and service type enums
DO $$ BEGIN
  CREATE TYPE merchant_type AS ENUM ('restaurant', 'pharmacy', 'laundry', 'grocery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('food', 'grocery', 'ride', 'pharmacy', 'parcel', 'laundry', 'home_service');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rename restaurants → merchants and add new columns
ALTER TABLE restaurants RENAME TO merchants;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS merchant_type merchant_type DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS service_types service_type[] DEFAULT '{food}',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Backwards-compatible view so existing food code keeps working
CREATE OR REPLACE VIEW restaurants AS
  SELECT * FROM merchants WHERE merchant_type = 'restaurant';

-- Orders: add service_type, service_payload, scheduled_for
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'food',
  ADD COLUMN IF NOT EXISTS service_payload jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Make restaurant_id nullable for service types that don't need a merchant (parcels, rides)
ALTER TABLE orders ALTER COLUMN restaurant_id DROP NOT NULL;

-- Drivers: add service capabilities
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS service_capabilities service_type[] DEFAULT '{food,grocery,ride}';

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_type ON merchants(merchant_type);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Update find_nearest_drivers to accept optional service_type filter
CREATE OR REPLACE FUNCTION find_nearest_drivers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 10,
  p_limit integer DEFAULT 5,
  p_service_type service_type DEFAULT NULL
)
RETURNS TABLE(
  driver_id uuid,
  distance_km double precision,
  latitude double precision,
  longitude double precision,
  vehicle_type text,
  rating double precision,
  service_capabilities service_type[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS driver_id,
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(d.latitude)) *
      cos(radians(d.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(d.latitude))
    )) AS distance_km,
    d.latitude,
    d.longitude,
    d.vehicle_type,
    d.rating::double precision,
    d.service_capabilities
  FROM drivers d
  WHERE d.is_online = true
    AND d.kyc_status = 'verified'
    AND d.latitude IS NOT NULL
    AND d.longitude IS NOT NULL
    AND (p_service_type IS NULL OR p_service_type = ANY(d.service_capabilities))
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(d.latitude)) *
      cos(radians(d.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(d.latitude))
    )) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prescriptions table for pharmacy orders
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Vendors can verify prescriptions"
  ON prescriptions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM merchants m
    WHERE m.owner_id = auth.uid()
    AND m.merchant_type = 'pharmacy'
  ));

CREATE POLICY "Service role full access to prescriptions"
  ON prescriptions FOR ALL
  TO service_role
  USING (true);

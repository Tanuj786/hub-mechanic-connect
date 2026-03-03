
-- Add base_price to service_types for price estimation
ALTER TABLE public.service_types ADD COLUMN base_price numeric DEFAULT 200;
ALTER TABLE public.service_types ADD COLUMN night_multiplier numeric DEFAULT 1.3;

-- Create geo_zones table for geo-fencing areas (highways, industrial zones, etc.)
CREATE TABLE public.geo_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_type text NOT NULL DEFAULT 'highway', -- highway, industrial, residential, commercial
  center_latitude numeric NOT NULL,
  center_longitude numeric NOT NULL,
  radius_km numeric NOT NULL DEFAULT 5,
  alert_message text NOT NULL DEFAULT 'Need help? Mechanics are nearby!',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.geo_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active geo zones"
  ON public.geo_zones FOR SELECT
  USING (is_active = true);

-- Create pricing_rules table for dynamic pricing
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'time_multiplier', -- time_multiplier, distance_multiplier, demand_multiplier
  multiplier numeric NOT NULL DEFAULT 1.0,
  condition_value text, -- e.g., "night", "0-5km", "high_demand"
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (is_active = true);

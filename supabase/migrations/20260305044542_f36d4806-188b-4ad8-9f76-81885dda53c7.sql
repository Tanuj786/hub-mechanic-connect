
-- Add 'corporate' to user_type enum
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'corporate';

-- Corporate accounts table
CREATE TABLE public.corporate_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_email TEXT,
  company_phone TEXT,
  gst_number TEXT,
  address TEXT,
  total_vehicles INTEGER NOT NULL DEFAULT 0,
  active_requests INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own corporate account"
  ON public.corporate_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own corporate account"
  ON public.corporate_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own corporate account"
  ON public.corporate_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Fleet vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type public.vehicle_type NOT NULL DEFAULT 'car',
  driver_name TEXT,
  driver_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_services INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  last_service_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corporate users can view their fleet vehicles"
  ON public.fleet_vehicles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = fleet_vehicles.corporate_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Corporate users can insert fleet vehicles"
  ON public.fleet_vehicles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = fleet_vehicles.corporate_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Corporate users can update fleet vehicles"
  ON public.fleet_vehicles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = fleet_vehicles.corporate_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Corporate users can delete fleet vehicles"
  ON public.fleet_vehicles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = fleet_vehicles.corporate_id AND ca.user_id = auth.uid()
  ));

-- Bulk service requests linking table
CREATE TABLE public.bulk_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  fleet_vehicle_id UUID REFERENCES public.fleet_vehicles(id) ON DELETE SET NULL,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  batch_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corporate users can view their bulk requests"
  ON public.bulk_service_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = bulk_service_requests.corporate_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Corporate users can insert bulk requests"
  ON public.bulk_service_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca
    WHERE ca.id = bulk_service_requests.corporate_id AND ca.user_id = auth.uid()
  ));

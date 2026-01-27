-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('customer', 'mechanic');

-- Create service status enum
CREATE TYPE public.service_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- Create vehicle type enum
CREATE TYPE public.vehicle_type AS ENUM ('car', 'bike', 'electric', 'battery', 'tyre', 'general');

-- Create profiles table (for both customers and mechanics)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  user_type user_type NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mechanic shops table
CREATE TABLE public.mechanic_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  gst_number TEXT,
  shop_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  whatsapp_number TEXT,
  hourly_rate DECIMAL(10, 2),
  years_of_experience INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mechanic_id)
);

-- Create services offered table
CREATE TABLE public.service_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service types
INSERT INTO public.service_types (name, icon) VALUES
  ('Tyre Puncture', 'circle-dot'),
  ('Fuel Delivery', 'fuel'),
  ('Engine Repair', 'settings'),
  ('Brake Repair', 'octagon'),
  ('Battery Jump Start', 'battery'),
  ('Towing Services', 'truck'),
  ('Oil Change', 'droplet'),
  ('AC Repair', 'wind');

-- Create mechanic services junction table
CREATE TABLE public.mechanic_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_type_id UUID REFERENCES public.service_types(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mechanic_id, service_type_id)
);

-- Create customer addresses table
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type_id UUID REFERENCES public.service_types(id) NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  status service_status DEFAULT 'pending',
  description TEXT,
  customer_address TEXT NOT NULL,
  customer_latitude DECIMAL(10, 8),
  customer_longitude DECIMAL(11, 8),
  estimated_cost DECIMAL(10, 2),
  final_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_request_id)
);

-- Create mechanic achievements table
CREATE TABLE public.mechanic_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mechanic_id, achievement_type)
);

-- Create mechanic settings table
CREATE TABLE public.mechanic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mechanic_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  push_notifications BOOLEAN DEFAULT true,
  location_sharing BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mechanic_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanic_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view mechanic profiles" ON public.profiles
  FOR SELECT USING (user_type = 'mechanic');

-- RLS Policies for mechanic_shops
CREATE POLICY "Shop owners can manage their shop" ON public.mechanic_shops
  FOR ALL USING (auth.uid() = mechanic_id);

CREATE POLICY "Anyone can view mechanic shops" ON public.mechanic_shops
  FOR SELECT USING (true);

-- RLS Policies for service_types
CREATE POLICY "Anyone can view service types" ON public.service_types
  FOR SELECT USING (true);

-- RLS Policies for mechanic_services
CREATE POLICY "Mechanics can manage their services" ON public.mechanic_services
  FOR ALL USING (auth.uid() = mechanic_id);

CREATE POLICY "Anyone can view mechanic services" ON public.mechanic_services
  FOR SELECT USING (true);

-- RLS Policies for customer_addresses
CREATE POLICY "Customers can manage their addresses" ON public.customer_addresses
  FOR ALL USING (auth.uid() = customer_id);

-- RLS Policies for service_requests
CREATE POLICY "Customers can view their requests" ON public.service_requests
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create requests" ON public.service_requests
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their pending requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = customer_id AND status = 'pending');

CREATE POLICY "Mechanics can view pending requests in their area" ON public.service_requests
  FOR SELECT USING (status = 'pending' OR auth.uid() = mechanic_id);

CREATE POLICY "Mechanics can accept and update assigned requests" ON public.service_requests
  FOR UPDATE USING (auth.uid() = mechanic_id OR (status = 'pending' AND mechanic_id IS NULL));

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for ratings
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Customers can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RLS Policies for mechanic_achievements
CREATE POLICY "Anyone can view mechanic achievements" ON public.mechanic_achievements
  FOR SELECT USING (true);

-- RLS Policies for mechanic_settings
CREATE POLICY "Mechanics can manage their settings" ON public.mechanic_settings
  FOR ALL USING (auth.uid() = mechanic_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update mechanic stats after rating
CREATE OR REPLACE FUNCTION public.update_mechanic_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mechanic_shops
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.ratings
      WHERE mechanic_id = NEW.mechanic_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE mechanic_id = NEW.mechanic_id
    ),
    updated_at = NOW()
  WHERE mechanic_id = NEW.mechanic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update mechanic rating
CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanic_rating();

-- Function to update mechanic stats after job completion
CREATE OR REPLACE FUNCTION public.update_mechanic_job_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.mechanic_shops
    SET 
      jobs_completed = jobs_completed + 1,
      total_earnings = total_earnings + COALESCE(NEW.final_cost, 0),
      updated_at = NOW()
    WHERE mechanic_id = NEW.mechanic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update job stats
CREATE TRIGGER on_service_completed
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanic_job_stats();

-- Enable realtime for notifications and service_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
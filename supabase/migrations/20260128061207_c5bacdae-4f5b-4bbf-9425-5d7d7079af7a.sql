-- Create storage bucket for work photos and videos
INSERT INTO storage.buckets (id, name, public) VALUES ('work-media', 'work-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for work media (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mechanics can upload work media' AND tablename = 'objects') THEN
    CREATE POLICY "Mechanics can upload work media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'work-media' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view work media' AND tablename = 'objects') THEN
    CREATE POLICY "Anyone can view work media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'work-media');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mechanics can delete their work media' AND tablename = 'objects') THEN
    CREATE POLICY "Mechanics can delete their work media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'work-media' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Create work_media table
CREATE TABLE IF NOT EXISTS public.work_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  mechanic_id UUID NOT NULL REFERENCES public.profiles(id),
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  media_stage TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mechanics can manage their work media' AND tablename = 'work_media') THEN
    CREATE POLICY "Mechanics can manage their work media"
    ON public.work_media FOR ALL
    USING (auth.uid() = mechanic_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can view their service work media' AND tablename = 'work_media') THEN
    CREATE POLICY "Customers can view their service work media"
    ON public.work_media FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND sr.customer_id = auth.uid()));
  END IF;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can view chat messages' AND tablename = 'chat_messages') THEN
    CREATE POLICY "Participants can view chat messages"
    ON public.chat_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND (sr.customer_id = auth.uid() OR sr.mechanic_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Participants can send chat messages' AND tablename = 'chat_messages') THEN
    CREATE POLICY "Participants can send chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND (sr.customer_id = auth.uid() OR sr.mechanic_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can mark their messages as read' AND tablename = 'chat_messages') THEN
    CREATE POLICY "Users can mark their messages as read"
    ON public.chat_messages FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.service_requests sr WHERE sr.id = service_request_id AND (sr.customer_id = auth.uid() OR sr.mechanic_id = auth.uid())));
  END IF;
END $$;

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  mechanic_id UUID NOT NULL REFERENCES public.profiles(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mechanics can create and view their invoices' AND tablename = 'invoices') THEN
    CREATE POLICY "Mechanics can create and view their invoices"
    ON public.invoices FOR ALL
    USING (auth.uid() = mechanic_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can view their invoices' AND tablename = 'invoices') THEN
    CREATE POLICY "Customers can view their invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = customer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can update their invoices for payment' AND tablename = 'invoices') THEN
    CREATE POLICY "Customers can update their invoices for payment"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = customer_id);
  END IF;
END $$;

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Invoice participants can view items' AND tablename = 'invoice_items') THEN
    CREATE POLICY "Invoice participants can view items"
    ON public.invoice_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_id AND (inv.customer_id = auth.uid() OR inv.mechanic_id = auth.uid())));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Mechanics can manage invoice items' AND tablename = 'invoice_items') THEN
    CREATE POLICY "Mechanics can manage invoice items"
    ON public.invoice_items FOR ALL
    USING (EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_id AND inv.mechanic_id = auth.uid()));
  END IF;
END $$;

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate invoice number
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON public.invoices;
CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoice_number();

-- Function to update invoice totals
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_invoice_id UUID;
BEGIN
  target_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  UPDATE public.invoices
  SET 
    subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM public.invoice_items WHERE invoice_id = target_invoice_id),
    tax_amount = (SELECT COALESCE(SUM(total_price), 0) FROM public.invoice_items WHERE invoice_id = target_invoice_id) * (tax_rate / 100),
    total_amount = (SELECT COALESCE(SUM(total_price), 0) FROM public.invoice_items WHERE invoice_id = target_invoice_id) * (1 + tax_rate / 100),
    updated_at = now()
  WHERE id = target_invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update invoice totals
DROP TRIGGER IF EXISTS update_invoice_totals_trigger ON public.invoice_items;
CREATE TRIGGER update_invoice_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_totals();
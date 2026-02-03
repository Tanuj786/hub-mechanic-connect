-- Add mechanic_response and mechanic_response_at columns to ratings table
ALTER TABLE public.ratings 
ADD COLUMN mechanic_response TEXT,
ADD COLUMN mechanic_response_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy for mechanics to update their responses
CREATE POLICY "Mechanics can respond to their reviews"
ON public.ratings
FOR UPDATE
USING (auth.uid() = mechanic_id)
WITH CHECK (auth.uid() = mechanic_id);
-- Catering enquiries table
CREATE TABLE IF NOT EXISTS public.catering_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  event_date date,
  guests integer NOT NULL DEFAULT 0,
  package text NOT NULL DEFAULT 'small',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Permissions
GRANT INSERT ON public.catering_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catering_enquiries TO authenticated;
GRANT ALL ON public.catering_enquiries TO service_role;

-- RLS
ALTER TABLE public.catering_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request catering" ON public.catering_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage catering enquiries" ON public.catering_enquiries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings (key-value store for editable content like video URL)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site settings are publicly readable" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the video_url setting (empty string = no video / coming soon)
INSERT INTO public.site_settings (key, value) VALUES ('video_url', '')
  ON CONFLICT (key) DO NOTHING;

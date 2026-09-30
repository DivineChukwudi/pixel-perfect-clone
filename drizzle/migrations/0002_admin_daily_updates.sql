-- Today's Special flag (app keeps it to one product at a time)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_special boolean NOT NULL DEFAULT false;

-- Public image bucket; only admins can upload, replace or delete
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update site images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete site images" ON storage.objects;

CREATE POLICY "Public read site images" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');
CREATE POLICY "Admins upload site images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

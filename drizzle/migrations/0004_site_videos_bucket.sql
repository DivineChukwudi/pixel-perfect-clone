-- Public video bucket; only admins can upload, replace or delete
INSERT INTO storage.buckets (id, name, public) VALUES ('site-videos', 'site-videos', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload site videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins update site videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete site videos" ON storage.objects;

CREATE POLICY "Public read site videos" ON storage.objects FOR SELECT
  USING (bucket_id = 'site-videos');
CREATE POLICY "Admins upload site videos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site videos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-videos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site videos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-videos' AND public.has_role(auth.uid(), 'admin'));

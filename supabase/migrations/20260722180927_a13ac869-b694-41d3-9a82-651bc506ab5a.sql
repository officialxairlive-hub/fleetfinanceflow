
CREATE POLICY "Shop members can view logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop members can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop members can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop members can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND public.is_shop_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

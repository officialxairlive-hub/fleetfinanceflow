CREATE POLICY "Shop members can view their shop logo"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'shop-logos' AND public.is_shop_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

CREATE POLICY "Shop members can upload their shop logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shop-logos' AND public.is_shop_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

CREATE POLICY "Shop members can update their shop logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'shop-logos' AND public.is_shop_member(auth.uid(), ((storage.foldername(name))[1])::uuid))
WITH CHECK (bucket_id = 'shop-logos' AND public.is_shop_member(auth.uid(), ((storage.foldername(name))[1])::uuid));

CREATE POLICY "Shop members can delete their shop logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'shop-logos' AND public.is_shop_member(auth.uid(), ((storage.foldername(name))[1])::uuid));
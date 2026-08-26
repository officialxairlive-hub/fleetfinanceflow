DROP POLICY "Shops insertable by authenticated users" ON public.shops;
CREATE POLICY "Shops insertable by signed in users" ON public.shops
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Customers can submit complaints" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);
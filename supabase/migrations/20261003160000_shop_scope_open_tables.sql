-- Add shop_id and shop-scoped RLS to customer_contacts, intake_requests, part_requests
-- Safe to re-run (idempotent)

-- === customer_contacts ===
ALTER TABLE public.customer_contacts ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id);
UPDATE public.customer_contacts SET shop_id = c.shop_id::uuid FROM public.customers c WHERE customer_contacts.customer_id = c.id AND customer_contacts.shop_id IS NULL;
ALTER TABLE public.customer_contacts ALTER COLUMN shop_id SET NOT NULL;
DROP POLICY IF EXISTS customer_contacts_all ON public.customer_contacts;
CREATE POLICY "Shop access for customer_contacts" ON public.customer_contacts FOR ALL TO public USING (shop_id = get_user_shop_id()) WITH CHECK (shop_id = get_user_shop_id());

-- === intake_requests ===
ALTER TABLE public.intake_requests ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id);
UPDATE public.intake_requests SET shop_id = c.shop_id::uuid FROM public.customers c WHERE intake_requests.customer_id = c.id AND intake_requests.shop_id IS NULL;
ALTER TABLE public.intake_requests ALTER COLUMN shop_id SET NOT NULL;
DROP POLICY IF EXISTS intake_requests_all ON public.intake_requests;
CREATE POLICY "Shop access for intake_requests" ON public.intake_requests FOR ALL TO public USING (shop_id = get_user_shop_id()) WITH CHECK (shop_id = get_user_shop_id());

-- === part_requests ===
ALTER TABLE public.part_requests ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id);
UPDATE public.part_requests SET shop_id = wo.shop_id::uuid FROM public.work_orders wo WHERE part_requests.work_order_id = wo.id AND part_requests.shop_id IS NULL;
ALTER TABLE public.part_requests ALTER COLUMN shop_id SET NOT NULL;
DROP POLICY IF EXISTS "Allow all access to part_requests" ON public.part_requests;
CREATE POLICY "Shop access for part_requests" ON public.part_requests FOR ALL TO public USING (shop_id = get_user_shop_id()) WITH CHECK (shop_id = get_user_shop_id());

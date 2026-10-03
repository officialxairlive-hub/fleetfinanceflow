-- Add shop_id to suppliers and scope RLS to shop
-- Safe to re-run (idempotent)

-- 1. Add shop_id column (nullable first, then backfill, then enforce NOT NULL)
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS shop_id uuid references public.shops(id);

-- 2. Backfill existing suppliers with the first shop (no existing rows, but safe either way)
UPDATE public.suppliers
  SET shop_id = (SELECT id FROM public.shops ORDER BY created_at ASC LIMIT 1)
  WHERE shop_id IS NULL;

-- 3. Enforce NOT NULL
ALTER TABLE public.suppliers
  ALTER COLUMN shop_id SET NOT NULL;

-- 4. Replace the open RLS policy with shop-scoped access
DROP POLICY IF EXISTS suppliers_all ON public.suppliers;

CREATE POLICY "Shop access for suppliers"
  ON public.suppliers
  FOR ALL
  TO public
  USING (shop_id = get_user_shop_id())
  WITH CHECK (shop_id = get_user_shop_id());

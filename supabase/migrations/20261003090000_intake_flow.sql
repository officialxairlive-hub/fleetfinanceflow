-- ============================================================
-- Intake flow: richer customer capture for work order creation
-- Applies against the LIVE schema (customers.id is TEXT, not UUID).
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. New customer columns -------------------------------------------------
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS usdot            TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS billing_street   TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS billing_city     TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS billing_state    TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS billing_zip      TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS billing_country  TEXT DEFAULT 'Canada';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS shop_id          TEXT;

-- 2. Multiple contacts per customer --------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id          TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
  name        TEXT,
  phone       TEXT,
  email       TEXT,
  is_primary  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_contacts_customer_id_idx
  ON public.customer_contacts (customer_id);

-- 2b. Vehicle-level fields captured on the Vehicle step -------------------
ALTER TABLE public.units      ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE public.units      ADD COLUMN IF NOT EXISTS plate_state  TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS parts_invoice_only BOOLEAN DEFAULT false;

-- 2c. Suppliers / vendors (Inventory → Suppliers tab) ----------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'Both',    -- Parts | Labor | Both
  contact     TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON public.suppliers (name);

-- Link parts to a supplier record; the legacy free-text `supplier` column stays as fallback.
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS supplier_id TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_all ON public.suppliers;
CREATE POLICY suppliers_all ON public.suppliers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Intake request links (customer-facing form) -------------------------
CREATE TABLE IF NOT EXISTS public.intake_requests (
  id            TEXT PRIMARY KEY,
  token         TEXT UNIQUE NOT NULL,
  shop_id       TEXT,
  customer_id   TEXT,
  work_order_id TEXT,
  status        TEXT DEFAULT 'pending',   -- pending | submitted | expired | cancelled
  payload       JSONB DEFAULT '{}'::jsonb,
  company       TEXT,
  usdot         TEXT,
  email         TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  submitted_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT (now() + interval '14 days')
);
CREATE INDEX IF NOT EXISTS intake_requests_token_idx  ON public.intake_requests (token);
CREATE INDEX IF NOT EXISTS intake_requests_status_idx ON public.intake_requests (status);

-- 4. Access ---------------------------------------------------------------
-- The app reads/writes customers with the anon key from the browser, and the
-- public intake page (no login) must read a token row. Keep these permissive
-- to match how the existing tables are reached by the client.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_contacts TO anon, authenticated;
GRANT ALL ON public.customer_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intake_requests  TO anon, authenticated;
GRANT ALL ON public.intake_requests  TO service_role;

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_requests   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_contacts_all ON public.customer_contacts;
CREATE POLICY customer_contacts_all ON public.customer_contacts
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS intake_requests_all ON public.intake_requests;
CREATE POLICY intake_requests_all ON public.intake_requests
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

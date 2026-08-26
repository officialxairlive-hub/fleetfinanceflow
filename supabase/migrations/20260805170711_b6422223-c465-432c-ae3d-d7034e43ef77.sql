-- ============ enums ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'mechanic', 'customer');

-- ============ shops ============
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_path TEXT,
  default_gst_rate NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  default_pst_rate NUMERIC(6,4) NOT NULL DEFAULT 0.07,
  default_supplies_pct NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  default_supplies_cap NUMERIC(12,2),
  default_labor_rate NUMERIC(10,2) NOT NULL DEFAULT 145,
  default_parts_markup_pct NUMERIC(6,4) NOT NULL DEFAULT 0.35,
  invoice_terms_days INTEGER NOT NULL DEFAULT 30,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  billing_address TEXT,
  gst_exempt BOOLEAN NOT NULL DEFAULT false,
  pst_exempt BOOLEAN NOT NULL DEFAULT false,
  gst_rate NUMERIC(6,4),
  pst_rate NUMERIC(6,4),
  gst_number TEXT,
  pst_number TEXT,
  labor_rate NUMERIC(10,2),
  parts_markup_pct NUMERIC(6,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_number TEXT,
  nickname TEXT,
  vin TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  unit_type TEXT,
  current_odometer NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  labor_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_hours NUMERIC(6,2) DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  markup_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts TO authenticated;
GRANT ALL ON public.parts TO service_role;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  work_status TEXT NOT NULL DEFAULT 'received',
  issue_date DATE,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  odometer NUMERIC(12,2),
  unit_number_snapshot TEXT,
  vin_snapshot TEXT,
  labor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  parts_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplies_pct NUMERIC(6,4) NOT NULL DEFAULT 0,
  supplies_cap NUMERIC(12,2),
  supplies_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  pst_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  stripe_connected_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, invoice_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'labor',
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  markup_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  hours NUMERIC(8,2),
  technician TEXT,
  gst_taxable BOOLEAN NOT NULL DEFAULT true,
  pst_taxable BOOLEAN NOT NULL DEFAULT true,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  estimate_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  converted_to_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  issue_date DATE,
  due_date DATE,
  odometer NUMERIC(12,2),
  labor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  parts_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplies_pct NUMERIC(6,4) NOT NULL DEFAULT 0,
  supplies_cap NUMERIC(12,2),
  supplies_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  pst_rate NUMERIC(6,4) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, estimate_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimates TO authenticated;
GRANT ALL ON public.estimates TO service_role;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'labor',
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  markup_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  hours NUMERIC(8,2),
  technician TEXT,
  gst_taxable BOOLEAN NOT NULL DEFAULT true,
  pst_taxable BOOLEAN NOT NULL DEFAULT true,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimate_items TO authenticated;
GRANT ALL ON public.estimate_items TO service_role;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT,
  reference TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  failure_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.repair_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  work_status TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_updates TO authenticated;
GRANT ALL ON public.repair_updates TO service_role;
ALTER TABLE public.repair_updates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'portal',
  status TEXT NOT NULL DEFAULT 'logged',
  message TEXT,
  balance_at_send NUMERIC(12,2),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_reminders TO authenticated;
GRANT ALL ON public.payment_reminders TO service_role;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  due_date DATE,
  due_odometer NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_accounts TO authenticated;
GRANT ALL ON public.connected_accounts TO service_role;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estimate_items_updated_at BEFORE UPDATE ON public.estimate_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON public.connected_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_shop_member(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND shop_id = _shop_id AND role <> 'customer');
$$;

CREATE OR REPLACE FUNCTION public.has_shop_role(_user_id UUID, _shop_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND shop_id = _shop_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_customer_id_for_user(_user_id UUID, _shop_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.customers WHERE user_id = _user_id AND shop_id = _shop_id LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_shop_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_shop_role(UUID, UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_id_for_user(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shop_role(UUID, UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_id_for_user(UUID, UUID) TO authenticated;

-- balance helper view
CREATE VIEW public.invoice_balances
WITH (security_invoker = true) AS
SELECT
  i.id AS invoice_id,
  i.shop_id,
  i.customer_id,
  i.total,
  COALESCE(p.paid_amount, 0) AS amount_paid,
  ROUND(i.total - COALESCE(p.paid_amount, 0), 2) AS balance_due,
  CASE
    WHEN i.status IN ('draft', 'void', 'cancelled') THEN i.status
    WHEN COALESCE(p.paid_amount, 0) >= i.total THEN 'paid'
    WHEN COALESCE(p.paid_amount, 0) > 0 THEN 'partially_paid'
    WHEN i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'unpaid'
  END AS effective_status
FROM public.invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount) AS paid_amount
  FROM public.payments
  WHERE status IN ('succeeded', 'paid', 'completed')
  GROUP BY invoice_id
) p ON p.invoice_id = i.id;

GRANT SELECT ON public.invoice_balances TO authenticated;
GRANT ALL ON public.invoice_balances TO service_role;

-- ============ policies ============
CREATE POLICY "Shops visible to members and customers" ON public.shops
  FOR SELECT TO authenticated
  USING (public.is_shop_member(auth.uid(), id) OR public.has_shop_role(auth.uid(), id, 'customer'));
CREATE POLICY "Shops insertable by signed in users" ON public.shops
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Shops editable by owners and admins" ON public.shops
  FOR UPDATE TO authenticated
  USING (public.has_shop_role(auth.uid(), id, 'owner') OR public.has_shop_role(auth.uid(), id, 'admin'))
  WITH CHECK (public.has_shop_role(auth.uid(), id, 'owner') OR public.has_shop_role(auth.uid(), id, 'admin'));
CREATE POLICY "Shops deletable by owners" ON public.shops
  FOR DELETE TO authenticated USING (public.has_shop_role(auth.uid(), id, 'owner'));

CREATE POLICY "User roles manageable by owners and admins" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_shop_role(auth.uid(), shop_id, 'owner') OR public.has_shop_role(auth.uid(), shop_id, 'admin'))
  WITH CHECK (public.has_shop_role(auth.uid(), shop_id, 'owner') OR public.has_shop_role(auth.uid(), shop_id, 'admin'));
CREATE POLICY "Users can see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can claim their first shop role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers manageable by staff" ON public.customers
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own record" ON public.customers
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Units manageable by staff" ON public.units
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own units" ON public.units
  FOR SELECT TO authenticated USING (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);

CREATE POLICY "Services manageable by staff" ON public.services
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));

CREATE POLICY "Parts manageable by staff" ON public.parts
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));

CREATE POLICY "Invoices manageable by staff" ON public.invoices
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);

CREATE POLICY "Invoice items manageable by staff" ON public.invoice_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)));
CREATE POLICY "Customers can see their own invoice items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.get_customer_id_for_user(auth.uid(), i.shop_id) = i.customer_id));

CREATE POLICY "Estimates manageable by staff" ON public.estimates
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own estimates" ON public.estimates
  FOR SELECT TO authenticated USING (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);

CREATE POLICY "Estimate items manageable by staff" ON public.estimate_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND public.is_shop_member(auth.uid(), e.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND public.is_shop_member(auth.uid(), e.shop_id)));
CREATE POLICY "Customers can see their own estimate items" ON public.estimate_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.estimates e WHERE e.id = estimate_id AND public.get_customer_id_for_user(auth.uid(), e.shop_id) = e.customer_id));

CREATE POLICY "Payments manageable by staff" ON public.payments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)));
CREATE POLICY "Customers can see their own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.get_customer_id_for_user(auth.uid(), i.shop_id) = i.customer_id));

CREATE POLICY "Repair updates manageable by staff" ON public.repair_updates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)));
CREATE POLICY "Customers can see their own repair updates" ON public.repair_updates
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.get_customer_id_for_user(auth.uid(), i.shop_id) = i.customer_id));

CREATE POLICY "Payment reminders manageable by staff" ON public.payment_reminders
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.is_shop_member(auth.uid(), i.shop_id)));
CREATE POLICY "Customers can see their own payment reminders" ON public.payment_reminders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.get_customer_id_for_user(auth.uid(), i.shop_id) = i.customer_id));

CREATE POLICY "Reminders manageable by staff" ON public.reminders
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own reminders" ON public.reminders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.units u WHERE u.id = unit_id AND public.get_customer_id_for_user(auth.uid(), u.shop_id) = u.customer_id));

CREATE POLICY "Complaints manageable by staff" ON public.complaints
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));
CREATE POLICY "Customers can see their own complaints" ON public.complaints
  FOR SELECT TO authenticated USING (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);
CREATE POLICY "Customers can submit complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (public.get_customer_id_for_user(auth.uid(), shop_id) = customer_id);

CREATE POLICY "Connected accounts manageable by staff" ON public.connected_accounts
  FOR ALL TO authenticated
  USING (public.is_shop_member(auth.uid(), shop_id)) WITH CHECK (public.is_shop_member(auth.uid(), shop_id));

CREATE INDEX idx_invoices_shop_status ON public.invoices (shop_id, status);
CREATE INDEX idx_invoices_customer ON public.invoices (customer_id);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items (invoice_id);
CREATE INDEX idx_payments_invoice ON public.payments (invoice_id);
CREATE INDEX idx_units_customer ON public.units (customer_id);
CREATE INDEX idx_repair_updates_invoice ON public.repair_updates (invoice_id);
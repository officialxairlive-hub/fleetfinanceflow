-- ============================================
-- FLEET FINANCE FLOW — Auth & Multi-Tenancy Schema
-- Run this script in the Supabase SQL Editor
-- ============================================

-- 1. Create Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Profiles table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'mechanic')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add shop_id to all existing tables (if not already added)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;

-- 4. Enable RLS on new tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop old permissive policies
DROP POLICY IF EXISTS "Enable all access for customers" ON customers;
DROP POLICY IF EXISTS "Enable all access for units" ON units;
DROP POLICY IF EXISTS "Enable all access for technicians" ON technicians;
DROP POLICY IF EXISTS "Enable all access for parts" ON parts;
DROP POLICY IF EXISTS "Enable all access for work_orders" ON work_orders;
DROP POLICY IF EXISTS "Enable all access for invoices" ON invoices;

-- 6. Create strict RLS policies (Users can only see data belonging to their shop)

-- Profiles
CREATE POLICY "Users can view profiles in their shop" 
ON profiles FOR SELECT USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid()) OR id = auth.uid()
);
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (id = auth.uid());

-- Shops
CREATE POLICY "Users can view their own shop" 
ON shops FOR SELECT USING (
  id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Customers
CREATE POLICY "Shop access for customers" 
ON customers FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Units
CREATE POLICY "Shop access for units" 
ON units FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Technicians
CREATE POLICY "Shop access for technicians" 
ON technicians FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Parts
CREATE POLICY "Shop access for parts" 
ON parts FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Work Orders
CREATE POLICY "Shop access for work_orders" 
ON work_orders FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Invoices
CREATE POLICY "Shop access for invoices" 
ON invoices FOR ALL USING (
  shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
);

-- Allow inserting into shops and profiles during signup (when user has no profile yet)
-- This is required because when an owner signs up, they need to create a shop and profile.
CREATE POLICY "Allow anon/authenticated to create shop during signup" 
ON shops FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated to insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically assign shop_id on insert for regular tables
CREATE OR REPLACE FUNCTION set_shop_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If shop_id is not provided, fetch it from the user's profile
    IF NEW.shop_id IS NULL THEN
        SELECT shop_id INTO NEW.shop_id FROM profiles WHERE id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-inject shop_id so the frontend doesn't have to send it manually
CREATE TRIGGER auto_set_shop_id_customers BEFORE INSERT ON customers FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_units BEFORE INSERT ON units FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_technicians BEFORE INSERT ON technicians FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_parts BEFORE INSERT ON parts FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_work_orders BEFORE INSERT ON work_orders FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_invoices BEFORE INSERT ON invoices FOR EACH ROW EXECUTE PROCEDURE set_shop_id();

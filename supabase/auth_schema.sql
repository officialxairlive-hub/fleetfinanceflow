-- ============================================
-- FLEET FINANCE FLOW — Multi-Shop & Multi-Tenancy Schema
-- Run this script in the Supabase SQL Editor
-- ============================================

-- 1. Create Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 3. Create Shop Members table (Allows an Owner to own multiple shops)
CREATE TABLE IF NOT EXISTS shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'mechanic')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, shop_id)
);

-- 4. Add shop_id to all existing tables (if not already added)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;

-- 5. Enable RLS on new tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

-- 6. Drop old policies
DROP POLICY IF EXISTS "Enable all access for customers" ON customers;
DROP POLICY IF EXISTS "Enable all access for units" ON units;
DROP POLICY IF EXISTS "Enable all access for technicians" ON technicians;
DROP POLICY IF EXISTS "Enable all access for parts" ON parts;
DROP POLICY IF EXISTS "Enable all access for work_orders" ON work_orders;
DROP POLICY IF EXISTS "Enable all access for invoices" ON invoices;

DROP POLICY IF EXISTS "Users can view profiles in their shop" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own shop" ON shops;
DROP POLICY IF EXISTS "Allow anon/authenticated to create shop during signup" ON shops;
DROP POLICY IF EXISTS "Users can view shops" ON shops;
DROP POLICY IF EXISTS "Shop access for customers" ON customers;
DROP POLICY IF EXISTS "Shop access for units" ON units;
DROP POLICY IF EXISTS "Shop access for technicians" ON technicians;
DROP POLICY IF EXISTS "Shop access for parts" ON parts;
DROP POLICY IF EXISTS "Shop access for work_orders" ON work_orders;
DROP POLICY IF EXISTS "Shop access for invoices" ON invoices;
DROP POLICY IF EXISTS "Members access for shop_members" ON shop_members;

-- 7. Helper Function to prevent infinite recursion
CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid();
$$;

-- 8. Create strict RLS policies

-- Profiles
CREATE POLICY "Users can view profiles in their shop" 
ON profiles FOR SELECT USING (
  shop_id = get_user_shop_id() OR id = auth.uid()
);
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Allow authenticated to insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shop Members (Allows users to see all shops they own or belong to)
CREATE POLICY "Members access for shop_members" 
ON shop_members FOR ALL USING (user_id = auth.uid());

-- Shops (Allow SELECT for shops user belongs to or during signup)
CREATE POLICY "Users can view shops" 
ON shops FOR SELECT USING (true);

CREATE POLICY "Allow anon/authenticated to create shop during signup" 
ON shops FOR INSERT WITH CHECK (true);

-- Customers
CREATE POLICY "Shop access for customers" 
ON customers FOR ALL USING (shop_id = get_user_shop_id());

-- Units
CREATE POLICY "Shop access for units" 
ON units FOR ALL USING (shop_id = get_user_shop_id());

-- Technicians
CREATE POLICY "Shop access for technicians" 
ON technicians FOR ALL USING (shop_id = get_user_shop_id());

-- Parts
CREATE POLICY "Shop access for parts" 
ON parts FOR ALL USING (shop_id = get_user_shop_id());

-- Work Orders
CREATE POLICY "Shop access for work_orders" 
ON work_orders FOR ALL USING (shop_id = get_user_shop_id());

-- Invoices
CREATE POLICY "Shop access for invoices" 
ON invoices FOR ALL USING (shop_id = get_user_shop_id());

-- 9. Function to automatically assign shop_id on insert for regular tables
CREATE OR REPLACE FUNCTION set_shop_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shop_id IS NULL THEN
        NEW.shop_id := get_user_shop_id();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop old triggers before recreating them
DROP TRIGGER IF EXISTS auto_set_shop_id_customers ON customers;
DROP TRIGGER IF EXISTS auto_set_shop_id_units ON units;
DROP TRIGGER IF EXISTS auto_set_shop_id_technicians ON technicians;
DROP TRIGGER IF EXISTS auto_set_shop_id_parts ON parts;
DROP TRIGGER IF EXISTS auto_set_shop_id_work_orders ON work_orders;
DROP TRIGGER IF EXISTS auto_set_shop_id_invoices ON invoices;

-- Add triggers to auto-inject shop_id
CREATE TRIGGER auto_set_shop_id_customers BEFORE INSERT ON customers FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_units BEFORE INSERT ON units FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_technicians BEFORE INSERT ON technicians FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_parts BEFORE INSERT ON parts FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_work_orders BEFORE INSERT ON work_orders FOR EACH ROW EXECUTE PROCEDURE set_shop_id();
CREATE TRIGGER auto_set_shop_id_invoices BEFORE INSERT ON invoices FOR EACH ROW EXECUTE PROCEDURE set_shop_id();

-- ============================================
-- FLEET FINANCE FLOW — Supabase Schema
-- Run this script in the Supabase SQL Editor
-- ============================================

-- Drop existing tables to start fresh (useful for dev)
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. CUSTOMERS TABLE
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT,
  labour_rate NUMERIC,
  parts_markup NUMERIC,
  tax_setting TEXT,
  notes TEXT,
  balance NUMERIC DEFAULT 0,
  fleet_size INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. UNITS (TRUCKS/FLEET) TABLE
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  vin TEXT,
  plate TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  engine_type TEXT,
  transmission TEXT,
  mileage INTEGER,
  engine_hours INTEGER,
  status TEXT DEFAULT 'active',
  last_service DATE,
  next_pm JSONB, -- Storing PM schedule object as JSONB for flexibility
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TECHNICIANS TABLE (Expanded with Canadian Payroll, Banking & Real-Time Sync)
CREATE TABLE technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  full_name TEXT,
  avatar TEXT,
  role TEXT,
  tech_type TEXT DEFAULT 'Journeyman Heavy Duty',
  phone TEXT,
  email TEXT,
  address TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  working_terms TEXT DEFAULT 'Full-Time Hourly',
  hourly_pay_cad NUMERIC DEFAULT 45.00,
  overtime_pay_cad NUMERIC DEFAULT 67.50,
  labour_rate NUMERIC DEFAULT 145.00,
  bank_name TEXT,
  institution_number TEXT, -- 3-digit Canadian institution # (e.g. 003 RBC, 004 TD)
  transit_number TEXT,     -- 5-digit branch/transit #
  account_number TEXT,     -- 7 to 12-digit account #
  pay_frequency TEXT DEFAULT 'Bi-Weekly',
  next_pay_date DATE,
  direct_deposit_notes TEXT,
  hours_today NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'off', -- 'off', 'active', 'repairing', 'waiting_parts', 'break'
  active_job TEXT,
  active_job_status TEXT,
  clocked_in TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats JSONB DEFAULT '{"hoursThisWeek":0,"jobsCompleted":0,"efficiency":100,"revenue":0,"comebacks":0}'::jsonb,
  shop_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PARTS INVENTORY TABLE
CREATE TABLE parts (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  supplier TEXT,
  cost NUMERIC NOT NULL,
  sell NUMERIC NOT NULL,
  markup NUMERIC NOT NULL,
  qty_on_hand INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  bin_location TEXT,
  category TEXT,
  is_core BOOLEAN DEFAULT FALSE,
  core_charge NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WORK ORDERS TABLE
-- Note: labour and parts are stored as JSONB arrays to match the UI's demoData structure perfectly
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  unit_display TEXT,
  customer_name TEXT,
  trailer TEXT,
  complaint TEXT,
  cause TEXT,
  correction TEXT,
  tech_id TEXT REFERENCES technicians(id) ON DELETE SET NULL,
  tech_name TEXT,
  priority TEXT DEFAULT 'normal',
  is_emergency BOOLEAN DEFAULT FALSE,
  is_roadside BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new',
  labour JSONB DEFAULT '[]'::jsonb, -- Array of labour objects
  parts JSONB DEFAULT '[]'::jsonb,  -- Array of parts objects
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs
  internal_notes TEXT,
  customer_notes TEXT,
  authorized BOOLEAN DEFAULT FALSE,
  signature TEXT,
  timer INTEGER DEFAULT 0,
  estimated_cost NUMERIC DEFAULT 0,
  margin NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INVOICES TABLE
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  work_order_id TEXT REFERENCES work_orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  labour_total NUMERIC DEFAULT 0,
  parts_total NUMERIC DEFAULT 0,
  shop_supplies NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES (Allow full read/write for demo purposes)
-- In a real production app, you would restrict these based on auth.uid()
CREATE POLICY "Enable all access for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for units" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for technicians" ON technicians FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for parts" ON parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for work_orders" ON work_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to work_orders
CREATE TRIGGER update_work_orders_modtime
BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

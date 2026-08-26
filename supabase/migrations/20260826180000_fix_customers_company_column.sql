-- Fix: ensure the customers table has 'company' column, not 'company_name'.
-- If the live database has 'company_name' (from an earlier schema state), rename it.
-- If it already has 'company', this is a no-op.

DO $$
BEGIN
  -- Rename company_name -> company if it exists and company does not
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'customers'
      AND column_name  = 'company_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'customers'
      AND column_name  = 'company'
  ) THEN
    ALTER TABLE public.customers RENAME COLUMN company_name TO company;
  END IF;

  -- Add 'company' column if neither 'company' nor 'company_name' exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'customers'
      AND column_name  = 'company'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN company TEXT;
  END IF;
END
$$;


ALTER TABLE public.customers
  ADD COLUMN gst_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN pst_exempt boolean NOT NULL DEFAULT false,
  ADD COLUMN gst_rate numeric(6,4),
  ADD COLUMN pst_rate numeric(6,4),
  ADD COLUMN gst_number text,
  ADD COLUMN pst_number text,
  ADD COLUMN labor_rate numeric(10,2),
  ADD COLUMN parts_markup_pct numeric(6,4);

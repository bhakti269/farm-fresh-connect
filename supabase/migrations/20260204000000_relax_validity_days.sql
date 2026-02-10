-- Allow validity_days 1-365 so product insert never fails on this constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_validity_days_check;
ALTER TABLE public.products ADD CONSTRAINT products_validity_days_check
  CHECK (validity_days >= 1 AND validity_days <= 365);

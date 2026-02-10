-- Remove pan_number column from farmers table
ALTER TABLE public.farmers DROP COLUMN IF EXISTS pan_number;

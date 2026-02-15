-- Add GST number field to farmers table
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS gst_number TEXT;

-- Make pan_number nullable in farmers table
ALTER TABLE public.farmers ALTER COLUMN pan_number DROP NOT NULL;
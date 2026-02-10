-- Add specification columns to products table
ALTER TABLE public.products
ADD COLUMN grade text,
ADD COLUMN moisture_content numeric,
ADD COLUMN purity numeric,
ADD COLUMN origin text,
ADD COLUMN harvest_date date;
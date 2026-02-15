-- =============================================================================
-- FarmFresh Connect - Full Database Setup
-- Run this in Supabase SQL Editor if you are setting up the database from scratch.
-- This creates all tables and policies needed for seller registration and products.
-- =============================================================================

-- 1. Enum for user roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'consumer', 'farmer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Sequence for farmer display ID
CREATE SEQUENCE IF NOT EXISTS farmer_id_seq START 1;

-- 3. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. farmers table (seller registration - one farmer per user)
CREATE TABLE IF NOT EXISTS public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  farmer_display_id TEXT NOT NULL UNIQUE DEFAULT ('FRM' || LPAD(NEXTVAL('farmer_id_seq')::TEXT, 6, '0')),
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  aadhar_number TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  gst_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drop pan_number if it exists (legacy)
ALTER TABLE public.farmers DROP COLUMN IF EXISTS pan_number;

-- 6. products table (when seller adds a product)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_negotiable BOOLEAN DEFAULT false,
  validity_days INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  grade TEXT,
  moisture_content NUMERIC,
  purity NUMERIC,
  origin TEXT,
  harvest_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow flexible validity_days (1-365) if strict check exists from older migration
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_validity_days_check;
ALTER TABLE public.products ADD CONSTRAINT products_validity_days_check
  CHECK (validity_days >= 1 AND validity_days <= 365);

-- 7. Other tables
CREATE TABLE IF NOT EXISTS public.prime_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 200,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  is_refunded BOOLEAN DEFAULT false,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  purchase_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE (consumer_id, farmer_id)
);

CREATE TABLE IF NOT EXISTS public.product_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  consumer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.farmer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  consumer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prime_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_feedback ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_farmers_updated_at ON public.farmers;
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert or update own role" ON public.user_roles;
CREATE POLICY "Users can insert or update own role" ON public.user_roles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: farmers (seller registration)
DROP POLICY IF EXISTS "Anyone can view farmers" ON public.farmers;
CREATE POLICY "Anyone can view farmers" ON public.farmers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create farmer profile" ON public.farmers;
CREATE POLICY "Users can create farmer profile" ON public.farmers FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Farmers can update their own profile" ON public.farmers;
CREATE POLICY "Farmers can update their own profile" ON public.farmers FOR UPDATE USING (auth.uid() = user_id);

-- RLS: products (seller adds product)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Farmers can view their own products" ON public.products;
CREATE POLICY "Farmers can view their own products" ON public.products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Farmers can create products" ON public.products;
CREATE POLICY "Farmers can create products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Farmers can update their products" ON public.products;
CREATE POLICY "Farmers can update their products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Farmers can delete their products" ON public.products;
CREATE POLICY "Farmers can delete their products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);

-- Other policies (profiles, prime_memberships, feedback) - keep minimal for this setup
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- Done. When a seller registers, the app inserts into farmers + user_roles.
-- When a seller adds a product, the app inserts into products.
-- =============================================================================

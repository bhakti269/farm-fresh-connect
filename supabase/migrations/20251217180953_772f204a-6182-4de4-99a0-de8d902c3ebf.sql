-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'consumer', 'farmer');

-- Create sequence for farmer_id
CREATE SEQUENCE IF NOT EXISTS farmer_id_seq START 1;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  farmer_display_id TEXT NOT NULL UNIQUE DEFAULT ('FRM' || LPAD(NEXTVAL('farmer_id_seq')::TEXT, 6, '0')),
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  aadhar_number TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cereals')),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  is_negotiable BOOLEAN DEFAULT false,
  validity_days INTEGER NOT NULL CHECK (validity_days IN (1, 5, 10, 30)),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prime_memberships table
CREATE TABLE public.prime_memberships (
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

-- Create product_feedback table
CREATE TABLE public.product_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  consumer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create farmer_feedback table
CREATE TABLE public.farmer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE NOT NULL,
  consumer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prime_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'consumer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for farmers
CREATE POLICY "Anyone can view farmers" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Users can create farmer profile" ON public.farmers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Farmers can update their own profile" ON public.farmers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Farmers can create products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);
CREATE POLICY "Farmers can update their products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = products.farmer_id AND f.user_id = auth.uid())
);

-- RLS Policies for prime_memberships
CREATE POLICY "Users can view their memberships" ON public.prime_memberships FOR SELECT USING (auth.uid() = consumer_id);
CREATE POLICY "Users can create memberships" ON public.prime_memberships FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Admins can update memberships" ON public.prime_memberships FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product_feedback
CREATE POLICY "Anyone can view product feedback" ON public.product_feedback FOR SELECT USING (true);
CREATE POLICY "Users can create product feedback" ON public.product_feedback FOR INSERT WITH CHECK (auth.uid() = consumer_id);

-- RLS Policies for farmer_feedback
CREATE POLICY "Anyone can view farmer feedback" ON public.farmer_feedback FOR SELECT USING (true);
CREATE POLICY "Users can create farmer feedback" ON public.farmer_feedback FOR INSERT WITH CHECK (auth.uid() = consumer_id);
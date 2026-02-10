-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New query → Paste & Run
-- (No Supabase CLI needed.)
-- =============================================================================

-- 1. Allow validity_days 1-365 so product insert never fails
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_validity_days_check;
ALTER TABLE public.products ADD CONSTRAINT products_validity_days_check
  CHECK (validity_days >= 1 AND validity_days <= 365);

-- 2. Allow app to save seller role when they register (user_roles insert/update)
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
CREATE POLICY "Users can update own role" ON public.user_roles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

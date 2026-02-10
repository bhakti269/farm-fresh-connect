-- Ensure farmers can insert and view their own products (INSERT already exists; add SELECT for own products)
-- INSERT: "Farmers can create products" already allows insert when farmer_id matches auth.uid() via farmers.user_id
-- Add SELECT so farmers can see all their own products (including inactive) in dashboard

CREATE POLICY "Farmers can view their own products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farmers f
    WHERE f.id = products.farmer_id AND f.user_id = auth.uid()
  )
);

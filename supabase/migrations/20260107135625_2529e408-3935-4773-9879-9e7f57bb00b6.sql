-- Allow farmers to delete their own products
CREATE POLICY "Farmers can delete their products"
ON public.products
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM farmers f
  WHERE f.id = products.farmer_id AND f.user_id = auth.uid()
));
ALTER TABLE public.orders ADD COLUMN status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'processing', 'dispatched', 'delivered'));
REVOKE SELECT ON public.orders FROM anon;
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
DROP POLICY IF EXISTS "public read orders" ON public.orders;
CREATE POLICY "Store members read store orders" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.store_members m WHERE m.user_id = auth.uid() AND m.store_id = orders.store_id));
CREATE POLICY "Administrators read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
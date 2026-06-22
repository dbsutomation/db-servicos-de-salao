CREATE POLICY "Authenticated can view active salons"
  ON public.salons FOR SELECT TO authenticated
  USING (is_active = true);

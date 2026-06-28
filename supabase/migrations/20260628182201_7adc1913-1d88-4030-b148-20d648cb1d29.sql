
CREATE OR REPLACE FUNCTION public.get_customer_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT salon_id FROM public.customers WHERE id = auth.uid();
$$;

CREATE POLICY "Customers can view professionals of own salon"
ON public.users FOR SELECT TO authenticated
USING (salon_id = public.get_customer_salon_id());

CREATE POLICY "Customers can view services of own salon"
ON public.services FOR SELECT TO authenticated
USING (salon_id = public.get_customer_salon_id());

CREATE POLICY "Customers can view appointments of own salon"
ON public.appointments FOR SELECT TO authenticated
USING (salon_id = public.get_customer_salon_id());

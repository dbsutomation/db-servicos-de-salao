-- FASE 1: vínculo cliente-salão por linha

ALTER TABLE public.customers DROP CONSTRAINT customers_pkey;
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id, salon_id);

CREATE OR REPLACE FUNCTION public.customer_has_salon(p_salon_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = auth.uid() AND c.salon_id = p_salon_id
  )
$$;

CREATE OR REPLACE FUNCTION public.customer_owns_client_in_salon(p_salon_id uuid, p_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers c
    WHERE c.id = auth.uid()
      AND c.salon_id = p_salon_id
      AND c.client_id = p_client_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_salon_active(p_salon_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = p_salon_id AND s.status = 'ativo'
  )
$$;

REVOKE ALL ON FUNCTION public.customer_has_salon(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.customer_owns_client_in_salon(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_salon_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_has_salon(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.customer_owns_client_in_salon(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_salon_active(uuid) TO authenticated, service_role;

-- appointments (somente ramos do cliente)
ALTER POLICY "Authenticated salon members create appointments" ON public.appointments
WITH CHECK (
  (public.is_salon_active() AND salon_id = public.get_user_salon_id())
  OR (public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id, client_id))
);

ALTER POLICY "Customers view own appointments" ON public.appointments
USING (public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id, client_id));

ALTER POLICY "Customers cancel own appointments" ON public.appointments
USING (public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id, client_id))
WITH CHECK (public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id, client_id));

-- appointment_services (somente ramos do cliente)
ALTER POLICY "Insert appointment services for accessible appointments" ON public.appointment_services
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        (public.is_salon_active() AND a.salon_id = public.get_user_salon_id())
        OR (public.is_salon_active(a.salon_id) AND public.customer_owns_client_in_salon(a.salon_id, a.client_id))
      )
  )
);

ALTER POLICY "View appointment services if can view appointment" ON public.appointment_services
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        (public.is_salon_active() AND a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id())
        OR (public.is_salon_active() AND a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'::app_role))
        OR (public.is_salon_active(a.salon_id) AND public.customer_owns_client_in_salon(a.salon_id, a.client_id))
      )
  )
);

-- services: ramo do cliente por vínculo com o salão da linha
ALTER POLICY "Customers can view services of own salon" ON public.services
USING (public.is_salon_active(salon_id) AND public.customer_has_salon(salon_id));

-- users (profissionais visíveis ao cliente)
ALTER POLICY "Customers can view professionals of own salon" ON public.users
USING (public.is_salon_active(salon_id) AND public.customer_has_salon(salon_id));

-- professional_schedules: mantém ramo da equipe, corrige ramo do cliente
ALTER POLICY "Authenticated can view active schedules of their salon" ON public.professional_schedules
USING (
  is_active = true
  AND (
    (public.is_salon_active() AND salon_id = public.get_user_salon_id())
    OR (public.is_salon_active(salon_id) AND public.customer_has_salon(salon_id))
  )
);

-- customers: validação linha a linha
ALTER POLICY "Customer can update own record" ON public.customers
USING (public.is_salon_active(salon_id) AND auth.uid() = id)
WITH CHECK (public.is_salon_active(salon_id) AND auth.uid() = id);
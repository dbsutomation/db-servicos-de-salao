-- 1. Tabela de administradores da plataforma
CREATE TABLE public.system_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_admins TO authenticated;
GRANT ALL ON public.system_admins TO service_role;

ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own admin record"
ON public.system_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. Colunas em salons
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS provision_ref uuid;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_status_check CHECK (status IN ('ativo','suspenso'));

CREATE UNIQUE INDEX IF NOT EXISTS salons_provision_ref_key
  ON public.salons(provision_ref) WHERE provision_ref IS NOT NULL;

-- 3. Funções
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_admins sa WHERE sa.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_system_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated, service_role;

-- Falha segura: sem vínculo inequívoco -> false
CREATE OR REPLACE FUNCTION public.is_salon_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_salon uuid;
  v_count int;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*), min(salon_id) INTO v_count, v_salon
  FROM public.users WHERE id = v_uid;

  IF v_count = 0 THEN
    SELECT count(*), min(salon_id) INTO v_count, v_salon
    FROM public.customers WHERE id = v_uid;
  END IF;

  IF v_count <> 1 OR v_salon IS NULL THEN
    RETURN false;
  END IF;

  SELECT status INTO v_status FROM public.salons WHERE id = v_salon;

  IF v_status IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_status = 'ativo';
END;
$$;

REVOKE ALL ON FUNCTION public.is_salon_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_salon_active() TO authenticated, service_role;

-- Listagem administrativa (evita leitura ampla de users)
CREATE OR REPLACE FUNCTION public.admin_list_salons()
RETURNS TABLE (
  id uuid, name text, owner_name text, phone text, address text,
  status text, created_at timestamptz, professionals_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, o.name AS owner_name, s.phone, s.address,
         s.status, s.created_at,
         (SELECT count(*) FROM public.users u WHERE u.salon_id = s.id) AS professionals_count
  FROM public.salons s
  LEFT JOIN public.users o ON o.id = s.owner_id
  WHERE public.is_system_admin()
  ORDER BY s.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_salons() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_salons() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_get_salon(p_salon_id uuid)
RETURNS TABLE (
  id uuid, name text, owner_name text, owner_email text, phone text, address text,
  status text, created_at timestamptz, professionals_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, o.name AS owner_name, o.email AS owner_email, s.phone, s.address,
         s.status, s.created_at,
         (SELECT count(*) FROM public.users u WHERE u.salon_id = s.id) AS professionals_count
  FROM public.salons s
  LEFT JOIN public.users o ON o.id = s.owner_id
  WHERE s.id = p_salon_id AND public.is_system_admin();
$$;

REVOKE ALL ON FUNCTION public.admin_get_salon(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_salon(uuid) TO authenticated, service_role;

-- 4. Acesso administrativo a salons (somente dados do salão)
GRANT UPDATE (name, phone, address, status) ON public.salons TO authenticated;

CREATE POLICY "System admins can view all salons"
ON public.salons FOR SELECT TO authenticated
USING (public.is_system_admin());

CREATE POLICY "System admins can update salons"
ON public.salons FOR UPDATE TO authenticated
USING (public.is_system_admin())
WITH CHECK (public.is_system_admin());

-- 5. Bloqueio de salão suspenso nas políticas operacionais existentes
-- appointments
ALTER POLICY "Authenticated salon members create appointments" ON public.appointments
WITH CHECK (public.is_salon_active() AND ((salon_id = get_user_salon_id()) OR (salon_id = (SELECT customers.salon_id FROM customers WHERE customers.id = auth.uid()))));

ALTER POLICY "Customers cancel own appointments" ON public.appointments
USING (public.is_salon_active() AND client_id = (SELECT customers.client_id FROM customers WHERE customers.id = auth.uid()))
WITH CHECK (public.is_salon_active() AND client_id = (SELECT customers.client_id FROM customers WHERE customers.id = auth.uid()));

ALTER POLICY "Customers view own appointments" ON public.appointments
USING (public.is_salon_active() AND client_id = (SELECT customers.client_id FROM customers WHERE customers.id = auth.uid()));

ALTER POLICY "Managers delete salon appointments" ON public.appointments
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role));

ALTER POLICY "Managers update salon appointments" ON public.appointments
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role));

ALTER POLICY "Managers view salon appointments" ON public.appointments
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role));

ALTER POLICY "Professionals delete own appointments" ON public.appointments
USING (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Professionals update own appointments" ON public.appointments
USING (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Professionals view own appointments" ON public.appointments
USING (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()));

-- appointment_services
ALTER POLICY "Delete appointment services if can edit appointment" ON public.appointment_services
USING (public.is_salon_active() AND EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_services.appointment_id AND (((a.professional_id = auth.uid()) AND (a.salon_id = get_user_salon_id())) OR ((a.salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role)))));

ALTER POLICY "Insert appointment services for accessible appointments" ON public.appointment_services
WITH CHECK (public.is_salon_active() AND EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_services.appointment_id AND ((a.salon_id = get_user_salon_id()) OR (a.salon_id = (SELECT customers.salon_id FROM customers WHERE customers.id = auth.uid())))));

ALTER POLICY "Update appointment services if can edit appointment" ON public.appointment_services
USING (public.is_salon_active() AND EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_services.appointment_id AND (((a.professional_id = auth.uid()) AND (a.salon_id = get_user_salon_id())) OR ((a.salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role)))));

ALTER POLICY "View appointment services if can view appointment" ON public.appointment_services
USING (public.is_salon_active() AND EXISTS (SELECT 1 FROM appointments a WHERE a.id = appointment_services.appointment_id AND (((a.professional_id = auth.uid()) AND (a.salon_id = get_user_salon_id())) OR ((a.salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role)) OR (a.client_id = (SELECT customers.client_id FROM customers WHERE customers.id = auth.uid())))));

-- clients
ALTER POLICY "Managers can manage clients of own salon" ON public.clients
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Users can create clients in own salon" ON public.clients
WITH CHECK (public.is_salon_active() AND (salon_id = get_user_salon_id()));

ALTER POLICY "Users can view clients of own salon" ON public.clients
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()));

-- customers
ALTER POLICY "Customer can update own record" ON public.customers
USING (public.is_salon_active() AND auth.uid() = id)
WITH CHECK (public.is_salon_active() AND auth.uid() = id);

ALTER POLICY "Manager can view customers of own salon" ON public.customers
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

-- expenses
ALTER POLICY "Managers can manage expenses of own salon" ON public.expenses
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Managers can view expenses of own salon" ON public.expenses
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

-- professional_schedules
ALTER POLICY "Authenticated can view active schedules of their salon" ON public.professional_schedules
USING (public.is_salon_active() AND (is_active = true) AND ((salon_id = get_user_salon_id()) OR (salon_id = get_customer_salon_id())));

ALTER POLICY "Managers manage salon schedules" ON public.professional_schedules
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (public.is_salon_active() AND (salon_id = get_user_salon_id()) AND has_role(auth.uid(), 'manager'::app_role));

ALTER POLICY "Professionals manage own schedules" ON public.professional_schedules
USING (public.is_salon_active() AND (professional_id = auth.uid()))
WITH CHECK (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()));

-- service_records
ALTER POLICY "Managers can manage service records of own salon" ON public.service_records
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Managers can view service records of own salon" ON public.service_records
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Professionals can view own records in salon" ON public.service_records
USING (public.is_salon_active() AND (professional_id = auth.uid()) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Users can create service records in own salon" ON public.service_records
WITH CHECK (public.is_salon_active() AND (salon_id = get_user_salon_id()));

-- services
ALTER POLICY "Customers can view services of own salon" ON public.services
USING (public.is_salon_active() AND (salon_id = get_customer_salon_id()));

ALTER POLICY "Managers can manage services of own salon" ON public.services
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Users can view services of own salon" ON public.services
USING (public.is_salon_active() AND (salon_id = get_user_salon_id()));

-- users (mantém leitura do próprio cadastro para exibir aviso de suspensão)
ALTER POLICY "Customers can view professionals of own salon" ON public.users
USING (public.is_salon_active() AND (salon_id = get_customer_salon_id()));

ALTER POLICY "Managers can manage users of own salon" ON public.users
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()))
WITH CHECK (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Managers can view users of own salon" ON public.users
USING (public.is_salon_active() AND has_role(auth.uid(), 'manager'::app_role) AND (salon_id = get_user_salon_id()));

ALTER POLICY "Users can update their own profile" ON public.users
USING (public.is_salon_active() AND id = auth.uid())
WITH CHECK (public.is_salon_active() AND id = auth.uid());
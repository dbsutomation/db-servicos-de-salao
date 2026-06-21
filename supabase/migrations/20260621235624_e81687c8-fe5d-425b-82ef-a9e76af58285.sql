
-- PARTE 1: salons
CREATE TABLE public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.salons TO authenticated;
GRANT ALL ON public.salons TO service_role;

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.salons (id, name, owner_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'Salão Paulo Ubiratan', '370a534f-f328-46c3-85eb-9fa766b4f8bb');

-- PARTE 2: salon_id nas tabelas + backfill
ALTER TABLE public.users           ADD COLUMN salon_id uuid REFERENCES public.salons(id);
ALTER TABLE public.clients         ADD COLUMN salon_id uuid REFERENCES public.salons(id);
ALTER TABLE public.services        ADD COLUMN salon_id uuid REFERENCES public.salons(id);
ALTER TABLE public.service_records ADD COLUMN salon_id uuid REFERENCES public.salons(id);
ALTER TABLE public.expenses        ADD COLUMN salon_id uuid REFERENCES public.salons(id);

UPDATE public.users           SET salon_id = '00000000-0000-0000-0000-000000000001' WHERE salon_id IS NULL;
UPDATE public.clients         SET salon_id = '00000000-0000-0000-0000-000000000001' WHERE salon_id IS NULL;
UPDATE public.services        SET salon_id = '00000000-0000-0000-0000-000000000001' WHERE salon_id IS NULL;
UPDATE public.service_records SET salon_id = '00000000-0000-0000-0000-000000000001' WHERE salon_id IS NULL;
UPDATE public.expenses        SET salon_id = '00000000-0000-0000-0000-000000000001' WHERE salon_id IS NULL;

ALTER TABLE public.users           ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE public.clients         ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE public.services        ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE public.service_records ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE public.expenses        ALTER COLUMN salon_id SET NOT NULL;

ALTER TABLE public.salons
  ADD CONSTRAINT salons_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE RESTRICT;

-- PARTE 3: get_user_salon_id
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT salon_id FROM public.users WHERE id = auth.uid();
$$;

CREATE POLICY "Users can view own salon"
  ON public.salons FOR SELECT TO authenticated
  USING (id = public.get_user_salon_id());

-- PARTE 4: RLS multi-tenant
-- users
DROP POLICY IF EXISTS "Users can view their own profile"   ON public.users;
DROP POLICY IF EXISTS "Managers can view all users"        ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Managers can manage all users"      ON public.users;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Managers can view users of own salon"
  ON public.users FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Managers can manage users of own salon"
  ON public.users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id())
  WITH CHECK (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

-- clients
DROP POLICY IF EXISTS "Gerentes podem gerenciar todos os clientes" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can view clients"       ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients"     ON public.clients;
DROP POLICY IF EXISTS "Managers can manage all clients"            ON public.clients;

CREATE POLICY "Users can view clients of own salon"
  ON public.clients FOR SELECT TO authenticated
  USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Users can create clients in own salon"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (salon_id = public.get_user_salon_id());

CREATE POLICY "Managers can manage clients of own salon"
  ON public.clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id())
  WITH CHECK (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

-- services
DROP POLICY IF EXISTS "Gerentes podem gerenciar serviços"     ON public.services;
DROP POLICY IF EXISTS "Authenticated users can view services" ON public.services;
DROP POLICY IF EXISTS "Managers can manage services"          ON public.services;

CREATE POLICY "Users can view services of own salon"
  ON public.services FOR SELECT TO authenticated
  USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Managers can manage services of own salon"
  ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id())
  WITH CHECK (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

-- service_records
DROP POLICY IF EXISTS "Gerentes podem gerenciar todos os registros de serviço" ON public.service_records;
DROP POLICY IF EXISTS "Professionals can view their own records"               ON public.service_records;
DROP POLICY IF EXISTS "Managers can view all service records"                  ON public.service_records;
DROP POLICY IF EXISTS "Authenticated users can create service records"         ON public.service_records;
DROP POLICY IF EXISTS "Managers can manage all service records"                ON public.service_records;

CREATE POLICY "Professionals can view own records in salon"
  ON public.service_records FOR SELECT TO authenticated
  USING (professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers can view service records of own salon"
  ON public.service_records FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

CREATE POLICY "Users can create service records in own salon"
  ON public.service_records FOR INSERT TO authenticated
  WITH CHECK (salon_id = public.get_user_salon_id());

CREATE POLICY "Managers can manage service records of own salon"
  ON public.service_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id())
  WITH CHECK (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

-- expenses
DROP POLICY IF EXISTS "Gerentes podem gerenciar despesas" ON public.expenses;
DROP POLICY IF EXISTS "Managers can view all expenses"    ON public.expenses;
DROP POLICY IF EXISTS "Managers can manage expenses"      ON public.expenses;

CREATE POLICY "Managers can view expenses of own salon"
  ON public.expenses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers can manage expenses of own salon"
  ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id())
  WITH CHECK (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

-- PARTE 5: customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can view own record"
  ON public.customers FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customer can update own record"
  ON public.customers FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Manager can view customers of own salon"
  ON public.customers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'manager') AND salon_id = public.get_user_salon_id());

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PARTE 6: handle_new_user com 4 cenários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_meta            jsonb := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
  v_is_new_manager  boolean := COALESCE((v_meta->>'is_new_manager')::boolean, false);
  v_is_customer     boolean := COALESCE((v_meta->>'is_customer')::boolean, false);
  v_salon_name      text    := NULLIF(v_meta->>'salon_name', '');
  v_salon_id_text   text    := NULLIF(v_meta->>'salon_id', '');
  v_salon_id        uuid;
  v_name            text    := COALESCE(v_meta->>'name', new.email);
  v_phone_raw       text    := COALESCE(v_meta->>'phone', '');
  v_phone_digits    text;
  v_client_id       uuid;
  v_client_email    text;
BEGIN
  IF v_is_new_manager AND v_salon_name IS NOT NULL THEN
    INSERT INTO public.salons (name, owner_id)
    VALUES (v_salon_name, new.id)
    RETURNING id INTO v_salon_id;

    INSERT INTO public.users (id, name, email, has_access, is_manager, salon_id)
    VALUES (new.id, v_name, new.email, true, true, v_salon_id);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'manager') ON CONFLICT DO NOTHING;

    RETURN new;
  END IF;

  IF v_is_customer AND v_salon_id_text IS NOT NULL THEN
    BEGIN
      v_salon_id := v_salon_id_text::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'salon_id inválido no metadata: %', v_salon_id_text;
    END;

    IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id = v_salon_id) THEN
      RAISE EXCEPTION 'Salão informado (%) não existe', v_salon_id;
    END IF;

    v_phone_digits := regexp_replace(v_phone_raw, '\D', '', 'g');
    IF length(v_phone_digits) > 11 THEN
      v_phone_digits := right(v_phone_digits, 11);
    END IF;

    IF v_phone_digits <> '' THEN
      SELECT id, email INTO v_client_id, v_client_email
        FROM public.clients
       WHERE salon_id = v_salon_id
         AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = v_phone_digits
       LIMIT 1;
    END IF;

    IF v_client_id IS NOT NULL THEN
      IF v_client_email IS NULL OR v_client_email = '' THEN
        UPDATE public.clients SET email = new.email WHERE id = v_client_id;
      END IF;
    ELSE
      INSERT INTO public.clients (name, phone, email, salon_id)
      VALUES (v_name, v_phone_digits, new.email, v_salon_id)
      RETURNING id INTO v_client_id;
    END IF;

    INSERT INTO public.customers (id, client_id, salon_id, name, phone, email)
    VALUES (new.id, v_client_id, v_salon_id, v_name, v_phone_digits, new.email);

    RETURN new;
  END IF;

  IF v_salon_id_text IS NOT NULL THEN
    BEGIN
      v_salon_id := v_salon_id_text::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'salon_id inválido no metadata: %', v_salon_id_text;
    END;

    IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id = v_salon_id) THEN
      RAISE EXCEPTION 'Salão informado (%) não existe', v_salon_id;
    END IF;

    INSERT INTO public.users (id, name, email, has_access, is_manager, salon_id)
    VALUES (new.id, v_name, new.email, true, false, v_salon_id);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'professional') ON CONFLICT DO NOTHING;

    RETURN new;
  END IF;

  RETURN new;
END;
$function$;

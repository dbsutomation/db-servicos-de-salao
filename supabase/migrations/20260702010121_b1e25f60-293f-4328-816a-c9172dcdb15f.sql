
DROP POLICY IF EXISTS "Customers can view appointments of own salon" ON public.appointments;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
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
    INSERT INTO public.salons (name, owner_id) VALUES (v_salon_name, new.id) RETURNING id INTO v_salon_id;
    INSERT INTO public.users (id, name, email, has_access, is_manager, salon_id)
    VALUES (new.id, v_name, new.email, true, true, v_salon_id);
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'manager') ON CONFLICT DO NOTHING;
    RETURN new;
  END IF;
  IF v_is_customer AND v_salon_id_text IS NOT NULL THEN
    BEGIN v_salon_id := v_salon_id_text::uuid;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'salon_id inválido: %', v_salon_id_text; END;
    IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id = v_salon_id) THEN
      RAISE EXCEPTION 'Salão (%) não existe', v_salon_id;
    END IF;
    v_phone_digits := regexp_replace(v_phone_raw, '\D', '', 'g');
    IF length(v_phone_digits) > 11 THEN v_phone_digits := right(v_phone_digits, 11); END IF;
    IF v_phone_digits <> '' THEN
      SELECT id, email INTO v_client_id, v_client_email FROM public.clients
       WHERE salon_id = v_salon_id AND regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = v_phone_digits LIMIT 1;
    END IF;
    IF v_client_id IS NOT NULL THEN
      IF v_client_email IS NULL OR v_client_email = '' THEN
        UPDATE public.clients SET email = new.email WHERE id = v_client_id;
      END IF;
    ELSE
      INSERT INTO public.clients (name, phone, email, salon_id)
      VALUES (v_name, v_phone_digits, new.email, v_salon_id) RETURNING id INTO v_client_id;
    END IF;
    INSERT INTO public.customers (id, client_id, salon_id, name, phone, email)
    VALUES (new.id, v_client_id, v_salon_id, v_name, v_phone_digits, new.email);
    RETURN new;
  END IF;
  IF v_salon_id_text IS NOT NULL THEN
    BEGIN v_salon_id := v_salon_id_text::uuid;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'salon_id inválido: %', v_salon_id_text; END;
    IF NOT EXISTS (SELECT 1 FROM public.salons WHERE id = v_salon_id) THEN
      RAISE EXCEPTION 'Salão (%) não existe', v_salon_id;
    END IF;
    -- SECURITY: self-signup professionals must be approved by a manager
    INSERT INTO public.users (id, name, email, has_access, is_manager, salon_id)
    VALUES (new.id, v_name, new.email, false, false, v_salon_id);
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'professional') ON CONFLICT DO NOTHING;
    RETURN new;
  END IF;
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_users_privilege_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NOT public.has_role(auth.uid(), 'manager') THEN
    IF NEW.salon_id   IS DISTINCT FROM OLD.salon_id
       OR NEW.is_manager IS DISTINCT FROM OLD.is_manager
       OR NEW.has_access IS DISTINCT FROM OLD.has_access THEN
      RAISE EXCEPTION 'Não é permitido alterar salon_id, is_manager ou has_access do próprio usuário';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_users_privilege_change ON public.users;
CREATE TRIGGER trg_prevent_users_privilege_change
BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.prevent_users_privilege_change();

-- Storage
DROP POLICY IF EXISTS "images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "images_salon_upload" ON storage.objects;
DROP POLICY IF EXISTS "images_salon_update" ON storage.objects;
DROP POLICY IF EXISTS "images_salon_delete" ON storage.objects;

CREATE POLICY "images_salon_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-images' AND (storage.foldername(name))[1] = public.get_user_salon_id()::text);

CREATE POLICY "images_salon_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = public.get_user_salon_id()::text)
WITH CHECK (bucket_id = 'service-images' AND (storage.foldername(name))[1] = public.get_user_salon_id()::text);

CREATE POLICY "images_salon_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] = public.get_user_salon_id()::text);

-- Professional schedules
DROP POLICY IF EXISTS "Authenticated can view active schedules of their salon" ON public.professional_schedules;
CREATE POLICY "Authenticated can view active schedules of their salon"
ON public.professional_schedules FOR SELECT TO authenticated
USING (is_active = true AND (salon_id = public.get_user_salon_id() OR salon_id = public.get_customer_salon_id()));

-- Salons anon
DROP POLICY IF EXISTS "Anon users can view salon info for customer signup" ON public.salons;
CREATE OR REPLACE VIEW public.salons_public WITH (security_invoker = false) AS
SELECT id, name FROM public.salons WHERE is_active = true;
GRANT SELECT ON public.salons_public TO anon, authenticated;

-- user_roles manager scope
DROP POLICY IF EXISTS "Managers can manage roles" ON public.user_roles;
CREATE POLICY "Managers can manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'manager') AND EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = user_roles.user_id AND u.salon_id = public.get_user_salon_id()
))
WITH CHECK (public.has_role(auth.uid(), 'manager') AND EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = user_roles.user_id AND u.salon_id = public.get_user_salon_id()
));

-- Revoke EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.get_authenticated_user_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_authenticated_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_users_privilege_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_salon_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_salon_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;

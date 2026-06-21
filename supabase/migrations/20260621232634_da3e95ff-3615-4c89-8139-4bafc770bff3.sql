
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meta            jsonb := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
  v_is_new_manager  boolean := COALESCE((v_meta->>'is_new_manager')::boolean, false);
  v_salon_name      text    := NULLIF(v_meta->>'salon_name', '');
  v_salon_id_text   text    := NULLIF(v_meta->>'salon_id', '');
  v_salon_id        uuid;
  v_name            text    := COALESCE(v_meta->>'name', new.email);
BEGIN
  -- Cenário 1: novo gerente criando seu próprio salão
  IF v_is_new_manager AND v_salon_name IS NOT NULL THEN
    INSERT INTO public.salons (name, owner_id)
    VALUES (v_salon_name, new.id)
    RETURNING id INTO v_salon_id;

    INSERT INTO public.users (id, name, email, has_access, is_manager, salon_id)
    VALUES (new.id, v_name, new.email, true, true, v_salon_id);

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'manager')
    ON CONFLICT DO NOTHING;

    RETURN new;
  END IF;

  -- Cenário 2: usuário convidado para um salão existente
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
    VALUES (new.id, 'professional')
    ON CONFLICT DO NOTHING;

    RETURN new;
  END IF;

  -- Cenário 3: sem metadata relevante — não cria nada em public.users
  RETURN new;
END;
$$;

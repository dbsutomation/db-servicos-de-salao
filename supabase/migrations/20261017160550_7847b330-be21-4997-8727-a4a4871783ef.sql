CREATE OR REPLACE FUNCTION public.create_default_walk_in_client()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.clients (name, salon_id) VALUES ('Consumidor Final', NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_default_walk_in_client() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_salon_walk_in_client
AFTER INSERT ON public.salons
FOR EACH ROW EXECUTE FUNCTION public.create_default_walk_in_client();

-- Verify isolation and automatic creation in a subtransaction that rolls back test rows.
DO $$
DECLARE v_owner uuid; v_a uuid; v_b uuid; v_before bigint;
BEGIN
  SELECT owner_id INTO v_owner FROM public.salons LIMIT 1;
  SELECT count(*) INTO v_before FROM public.clients;
  IF v_owner IS NOT NULL THEN
    BEGIN
      INSERT INTO public.salons(name, owner_id) VALUES ('__onboarding_test_a__', v_owner) RETURNING id INTO v_a;
      INSERT INTO public.salons(name, owner_id) VALUES ('__onboarding_test_b__', v_owner) RETURNING id INTO v_b;
      IF (SELECT count(*) FROM public.clients WHERE salon_id = v_a AND name = 'Consumidor Final') <> 1 THEN
        RAISE EXCEPTION 'Default client missing for first establishment';
      END IF;
      IF (SELECT count(*) FROM public.clients WHERE salon_id = v_b AND name = 'Consumidor Final') <> 1 THEN
        RAISE EXCEPTION 'Default client missing for second establishment';
      END IF;
      IF (SELECT count(*) FROM public.clients) <> v_before + 2 THEN
        RAISE EXCEPTION 'Existing client data changed';
      END IF;
      RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Rollback successful onboarding test';
    EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
    END;
  END IF;
END;
$$;
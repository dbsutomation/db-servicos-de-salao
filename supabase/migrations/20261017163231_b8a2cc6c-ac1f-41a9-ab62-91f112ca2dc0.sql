-- Run through the approved migration tool. All fixture writes roll back.
DO $$
DECLARE blocked boolean := false; provisioned uuid;
BEGIN
  PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
  BEGIN
    PERFORM public.set_user_role('370a534f-f328-46c3-85eb-9fa766b4f8bb','manager','00000000-0000-0000-0000-000000000001');
  EXCEPTION WHEN raise_exception THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Anonymous role change was accepted'; END IF;
  blocked := false;
  PERFORM set_config('request.jwt.claims','{"role":"authenticated","sub":"370a534f-f328-46c3-85eb-9fa766b4f8bb"}',true);
  BEGIN
    PERFORM public.set_user_role('ba0bfbb8-1b0d-4a7c-94bb-06954e627cb6','manager','f80dfc89-f992-4bd9-985e-a78f65324dbe');
  EXCEPTION WHEN raise_exception THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Cross-establishment role change was accepted'; END IF;
  BEGIN
    PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
    provisioned := public.provision_new_salon('cd4eed31-5535-4b9f-9dd6-704ddcc0f3ca','Verification Only','verification@example.invalid','Verification Only');
    IF NOT EXISTS(SELECT 1 FROM public.clients WHERE salon_id=provisioned AND name='Consumidor Final') THEN RAISE EXCEPTION 'Missing default client'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id='cd4eed31-5535-4b9f-9dd6-704ddcc0f3ca' AND role='manager') THEN RAISE EXCEPTION 'Missing manager role'; END IF;
    RAISE EXCEPTION 'rollback_fixture' USING ERRCODE='P0002';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
END $$;
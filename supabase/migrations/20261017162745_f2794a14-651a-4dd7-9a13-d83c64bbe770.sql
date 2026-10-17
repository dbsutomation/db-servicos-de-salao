CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id uuid, p_role text, p_salon_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' AND NOT (public.is_salon_active() AND public.has_role(auth.uid(),'manager') AND p_salon_id = public.get_user_salon_id()) THEN RAISE EXCEPTION 'Acesso negado à alteração de permissões'; END IF;
 IF p_role NOT IN ('manager','professional') THEN RAISE EXCEPTION 'Papel inválido'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_user_id AND salon_id=p_salon_id) THEN RAISE EXCEPTION 'Usuário não pertence ao estabelecimento'; END IF;
 DELETE FROM public.user_roles WHERE user_id=p_user_id AND role <> p_role::public.app_role;
 INSERT INTO public.user_roles(user_id,role) VALUES(p_user_id,p_role::public.app_role) ON CONFLICT(user_id,role) DO NOTHING;
 UPDATE public.users SET is_manager=(p_role='manager') WHERE id=p_user_id;
 END $$;
REVOKE ALL ON FUNCTION public.set_user_role(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid,text,uuid) TO authenticated,service_role;
ALTER POLICY "Managers can view all roles" ON public.user_roles USING (user_id=auth.uid() OR (public.is_salon_active() AND public.has_role(auth.uid(),'manager') AND EXISTS (SELECT 1 FROM public.users u WHERE u.id=user_roles.user_id AND u.salon_id=public.get_user_salon_id())));
CREATE OR REPLACE FUNCTION public.prevent_users_privilege_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF auth.role()='authenticated' THEN
 IF NEW.salon_id IS DISTINCT FROM OLD.salon_id THEN RAISE EXCEPTION 'Não é permitido trocar o estabelecimento do usuário'; END IF;
 IF (NEW.is_manager,NEW.has_access) IS DISTINCT FROM (OLD.is_manager,OLD.has_access) AND NOT (public.has_role(auth.uid(),'manager') AND OLD.salon_id=public.get_user_salon_id()) THEN RAISE EXCEPTION 'Não é permitido alterar permissões'; END IF;
 END IF; RETURN NEW; END $$;
ALTER POLICY images_salon_upload ON storage.objects WITH CHECK (bucket_id='service-images' AND (storage.foldername(name))[1]=public.get_user_salon_id()::text AND public.is_salon_active() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY images_salon_update ON storage.objects USING (bucket_id='service-images' AND (storage.foldername(name))[1]=public.get_user_salon_id()::text AND public.is_salon_active() AND public.has_role(auth.uid(),'manager')) WITH CHECK (bucket_id='service-images' AND (storage.foldername(name))[1]=public.get_user_salon_id()::text AND public.is_salon_active() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY images_salon_delete ON storage.objects USING (bucket_id='service-images' AND (storage.foldername(name))[1]=public.get_user_salon_id()::text AND public.is_salon_active() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY images_public_read ON storage.objects TO authenticated USING (bucket_id='service-images' AND (storage.foldername(name))[1]=public.get_user_salon_id()::text AND public.is_salon_active());
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_meta jsonb:=COALESCE(NEW.raw_user_meta_data,'{}'::jsonb); v_salon_id uuid; v_client_id uuid; v_name text:=COALESCE(v_meta->>'name',NEW.email); v_phone text; BEGIN
 -- Public metadata never provisions staff or grants a role.
 IF v_meta->>'is_customer'='true' AND NULLIF(v_meta->>'salon_id','') IS NOT NULL THEN
 v_salon_id:=(v_meta->>'salon_id')::uuid;
 IF NOT public.salon_feature_enabled(v_salon_id,'agenda') THEN RAISE EXCEPTION 'Cadastro indisponível para este estabelecimento'; END IF;
 v_phone:=regexp_replace(COALESCE(v_meta->>'phone',''),'\D','','g');
 -- A phone number alone is not proof of ownership of an existing client.
 INSERT INTO public.clients(name,phone,email,salon_id) VALUES(v_name,v_phone,NEW.email,v_salon_id) RETURNING id INTO v_client_id;
 INSERT INTO public.customers(id,client_id,salon_id,name,phone,email) VALUES(NEW.id,v_client_id,v_salon_id,v_name,v_phone,NEW.email);
 END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.provision_new_salon(p_manager_id uuid,p_manager_name text,p_manager_email text,p_salon_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE v_salon_id uuid; BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Acesso restrito ao serviço administrativo'; END IF;
 IF EXISTS (SELECT 1 FROM public.users WHERE id=p_manager_id) THEN RAISE EXCEPTION 'Responsável já cadastrado'; END IF;
 INSERT INTO public.salons(name,owner_id,provision_ref) VALUES(p_salon_name,p_manager_id,gen_random_uuid()) RETURNING id INTO v_salon_id;
 INSERT INTO public.users(id,name,email,has_access,is_manager,salon_id) VALUES(p_manager_id,p_manager_name,p_manager_email,true,true,v_salon_id);
 INSERT INTO public.user_roles(user_id,role) VALUES(p_manager_id,'manager'); RETURN v_salon_id; END $$;
REVOKE ALL ON FUNCTION public.provision_new_salon(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_new_salon(uuid,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.validate_record_salon() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=NEW.client_id AND salon_id=NEW.salon_id) OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=NEW.professional_id AND salon_id=NEW.salon_id) OR NOT EXISTS(SELECT 1 FROM public.services WHERE id=NEW.service_id AND salon_id=NEW.salon_id) THEN RAISE EXCEPTION 'Cliente, profissional e serviço devem pertencer ao mesmo estabelecimento'; END IF;
 IF NEW.appointment_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.appointments WHERE id=NEW.appointment_id AND salon_id=NEW.salon_id) THEN RAISE EXCEPTION 'Agendamento pertence a outro estabelecimento'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.validate_record_salon() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_service_record_salon BEFORE INSERT OR UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.validate_record_salon();
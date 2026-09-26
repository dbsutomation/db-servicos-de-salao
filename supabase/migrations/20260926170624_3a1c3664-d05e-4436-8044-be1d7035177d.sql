CREATE OR REPLACE FUNCTION public.require_agenda_for_customer_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 IF NOT public.salon_feature_enabled(NEW.salon_id, 'agenda') THEN
   RAISE EXCEPTION 'Agendamentos indisponíveis para este salão';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER trg_require_agenda_for_customer_signup BEFORE INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.require_agenda_for_customer_signup();
REVOKE ALL ON FUNCTION public.require_agenda_for_customer_signup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.require_agenda_for_customer_signup() TO service_role;
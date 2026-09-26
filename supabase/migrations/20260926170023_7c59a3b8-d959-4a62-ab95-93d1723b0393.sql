CREATE OR REPLACE FUNCTION public.prevent_salon_feature_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF (NEW.feature_expenses, NEW.feature_agenda, NEW.feature_work_hours)
    IS DISTINCT FROM (OLD.feature_expenses, OLD.feature_agenda, OLD.feature_work_hours)
    AND NOT public.is_system_admin() THEN
   RAISE EXCEPTION 'Somente o administrador da plataforma pode alterar as funções do salão';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER trg_prevent_salon_feature_change BEFORE UPDATE ON public.salons FOR EACH ROW EXECUTE FUNCTION public.prevent_salon_feature_change();
REVOKE ALL ON FUNCTION public.prevent_salon_feature_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_salon_feature_change() TO service_role;
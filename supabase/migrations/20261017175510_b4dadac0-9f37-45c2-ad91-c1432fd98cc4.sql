CREATE OR REPLACE FUNCTION public.prevent_salon_feature_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    IF (NEW.feature_expenses, NEW.feature_agenda, NEW.feature_work_hours)
       IS DISTINCT FROM (OLD.feature_expenses, OLD.feature_agenda, OLD.feature_work_hours) THEN
      RAISE EXCEPTION 'Somente o administrador da plataforma pode alterar as funções do salão';
    END IF;
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Somente o administrador da plataforma pode alterar o responsável do salão';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Somente o administrador da plataforma pode alterar o status do salão';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE POLICY "Managers can update own salon basic data"
ON public.salons
FOR UPDATE
TO authenticated
USING (public.is_manager() AND id = public.get_user_salon_id())
WITH CHECK (public.is_manager() AND id = public.get_user_salon_id());
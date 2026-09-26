CREATE OR REPLACE FUNCTION public.salon_feature_enabled(p_salon_id uuid, p_feature text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT COALESCE((SELECT CASE p_feature
  WHEN 'expenses' THEN s.feature_expenses
  WHEN 'agenda' THEN s.feature_agenda
  WHEN 'work_hours' THEN s.feature_agenda AND s.feature_work_hours
  ELSE false END
 FROM public.salons s WHERE s.id = p_salon_id AND s.status = 'ativo'), false);
$$;
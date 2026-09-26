CREATE OR REPLACE FUNCTION public.get_busy_slots(p_professional_id uuid, p_date_start timestamptz, p_date_end timestamptz)
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT a.starts_at, a.ends_at FROM public.appointments a
 WHERE a.professional_id = p_professional_id
 AND a.status IN ('scheduled','confirmed','in_progress')
 AND a.starts_at >= p_date_start AND a.starts_at <= p_date_end
 AND public.salon_feature_enabled(a.salon_id,'agenda')
 AND ((a.salon_id = public.get_user_salon_id() AND public.is_salon_active())
 OR (public.is_salon_active(a.salon_id) AND public.customer_has_salon(a.salon_id)));
$$;
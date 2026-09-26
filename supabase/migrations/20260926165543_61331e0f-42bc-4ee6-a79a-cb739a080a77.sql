ALTER TABLE public.salons ADD COLUMN feature_expenses boolean NOT NULL DEFAULT true;
ALTER TABLE public.salons ADD COLUMN feature_agenda boolean NOT NULL DEFAULT true;
ALTER TABLE public.salons ADD COLUMN feature_work_hours boolean NOT NULL DEFAULT true;
ALTER TABLE public.salons ALTER COLUMN feature_expenses SET DEFAULT false;
ALTER TABLE public.salons ALTER COLUMN feature_agenda SET DEFAULT false;
ALTER TABLE public.salons ALTER COLUMN feature_work_hours SET DEFAULT false;
ALTER TABLE public.salons ADD CONSTRAINT work_hours_requires_agenda CHECK (NOT feature_work_hours OR feature_agenda);

CREATE OR REPLACE FUNCTION public.salon_feature_enabled(p_salon_id uuid, p_feature text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT COALESCE((SELECT CASE p_feature
  WHEN 'expenses' THEN s.feature_expenses
  WHEN 'agenda' THEN s.feature_agenda
  WHEN 'work_hours' THEN s.feature_agenda AND s.feature_work_hours
  ELSE false END
 FROM public.salons s WHERE s.id = p_salon_id AND s.status = 'ativo'), false);
$$;
REVOKE ALL ON FUNCTION public.salon_feature_enabled(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salon_feature_enabled(uuid,text) TO authenticated, service_role;

ALTER POLICY "Managers can manage expenses of own salon" ON public.expenses USING (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'expenses') AND public.has_role(auth.uid(),'manager') AND salon_id = public.get_user_salon_id()) WITH CHECK (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'expenses') AND public.has_role(auth.uid(),'manager') AND salon_id = public.get_user_salon_id());
ALTER POLICY "Managers can view expenses of own salon" ON public.expenses USING (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'expenses') AND public.has_role(auth.uid(),'manager') AND salon_id = public.get_user_salon_id());

ALTER POLICY "Authenticated salon members create appointments" ON public.appointments WITH CHECK (public.salon_feature_enabled(salon_id,'agenda') AND ((public.is_salon_active() AND salon_id = public.get_user_salon_id()) OR (public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id,client_id))));
ALTER POLICY "Customers view own appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id,client_id));
ALTER POLICY "Customers cancel own appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id,client_id)) WITH CHECK (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active(salon_id) AND public.customer_owns_client_in_salon(salon_id,client_id));
ALTER POLICY "Managers delete salon appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY "Managers update salon appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager')) WITH CHECK (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY "Managers view salon appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY "Professionals delete own appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id());
ALTER POLICY "Professionals update own appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id()) WITH CHECK (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id());
ALTER POLICY "Professionals view own appointments" ON public.appointments USING (public.salon_feature_enabled(salon_id,'agenda') AND public.is_salon_active() AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

ALTER POLICY "Insert appointment services for accessible appointments" ON public.appointment_services WITH CHECK (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_services.appointment_id AND public.salon_feature_enabled(a.salon_id,'agenda') AND ((public.is_salon_active() AND a.salon_id = public.get_user_salon_id()) OR (public.is_salon_active(a.salon_id) AND public.customer_owns_client_in_salon(a.salon_id,a.client_id)))));
ALTER POLICY "View appointment services if can view appointment" ON public.appointment_services USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_services.appointment_id AND public.salon_feature_enabled(a.salon_id,'agenda') AND ((public.is_salon_active() AND a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id()) OR (public.is_salon_active() AND a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager')) OR (public.is_salon_active(a.salon_id) AND public.customer_owns_client_in_salon(a.salon_id,a.client_id)))));
ALTER POLICY "Delete appointment services if can edit appointment" ON public.appointment_services USING (public.is_salon_active() AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_services.appointment_id AND public.salon_feature_enabled(a.salon_id,'agenda') AND ((a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id()) OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager')))));
ALTER POLICY "Update appointment services if can edit appointment" ON public.appointment_services USING (public.is_salon_active() AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_services.appointment_id AND public.salon_feature_enabled(a.salon_id,'agenda') AND ((a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id()) OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager'))))) WITH CHECK (public.is_salon_active() AND EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_services.appointment_id AND public.salon_feature_enabled(a.salon_id,'agenda') AND ((a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id()) OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager')))));

ALTER POLICY "Authenticated can view active schedules of their salon" ON public.professional_schedules USING (is_active = true AND public.salon_feature_enabled(salon_id,'work_hours') AND ((public.is_salon_active() AND salon_id = public.get_user_salon_id()) OR (public.is_salon_active(salon_id) AND public.customer_has_salon(salon_id))));
ALTER POLICY "Managers manage salon schedules" ON public.professional_schedules USING (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'work_hours') AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager')) WITH CHECK (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'work_hours') AND salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(),'manager'));
ALTER POLICY "Professionals manage own schedules" ON public.professional_schedules USING (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'work_hours') AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id()) WITH CHECK (public.is_salon_active() AND public.salon_feature_enabled(salon_id,'work_hours') AND professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

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
REVOKE ALL ON FUNCTION public.get_busy_slots(uuid,timestamptz,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid,timestamptz,timestamptz) TO authenticated, service_role;
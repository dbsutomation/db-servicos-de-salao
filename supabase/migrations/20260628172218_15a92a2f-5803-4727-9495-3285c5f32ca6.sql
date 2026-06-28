
-- =========================================
-- professional_schedules
-- =========================================
CREATE TABLE public.professional_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_schedules TO authenticated;
GRANT ALL ON public.professional_schedules TO service_role;

ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals manage own schedules"
  ON public.professional_schedules FOR ALL
  TO authenticated
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers manage salon schedules"
  ON public.professional_schedules FOR ALL
  TO authenticated
  USING (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'))
  WITH CHECK (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated can view active schedules of their salon"
  ON public.professional_schedules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE INDEX idx_professional_schedules_professional_id ON public.professional_schedules(professional_id);
CREATE INDEX idx_professional_schedules_salon_id ON public.professional_schedules(salon_id);

CREATE TRIGGER update_professional_schedules_updated_at
  BEFORE UPDATE ON public.professional_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- appointments
-- =========================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','completed')),
  cancelled_at timestamptz,
  cancelled_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- SELECT policies
CREATE POLICY "Professionals view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers view salon appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Customers view own appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (client_id = (SELECT client_id FROM public.customers WHERE id = auth.uid()));

-- INSERT: any authenticated user belonging to the salon, or the customer of the salon
CREATE POLICY "Authenticated salon members create appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    salon_id = public.get_user_salon_id()
    OR salon_id = (SELECT salon_id FROM public.customers WHERE id = auth.uid())
  );

-- UPDATE
CREATE POLICY "Professionals update own appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (professional_id = auth.uid() AND salon_id = public.get_user_salon_id())
  WITH CHECK (professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers update salon appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'))
  WITH CHECK (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Customers cancel own appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (client_id = (SELECT client_id FROM public.customers WHERE id = auth.uid()))
  WITH CHECK (client_id = (SELECT client_id FROM public.customers WHERE id = auth.uid()));

-- DELETE
CREATE POLICY "Professionals delete own appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (professional_id = auth.uid() AND salon_id = public.get_user_salon_id());

CREATE POLICY "Managers delete salon appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_appointments_professional_id ON public.appointments(professional_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(starts_at);
CREATE INDEX idx_appointments_salon_id ON public.appointments(salon_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- appointment_services
-- =========================================
CREATE TABLE public.appointment_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  service_name text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_services TO authenticated;
GRANT ALL ON public.appointment_services TO service_role;

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View appointment services if can view appointment"
  ON public.appointment_services FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        (a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id())
        OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'))
        OR (a.client_id = (SELECT client_id FROM public.customers WHERE id = auth.uid()))
      )
  ));

CREATE POLICY "Insert appointment services for accessible appointments"
  ON public.appointment_services FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        a.salon_id = public.get_user_salon_id()
        OR a.salon_id = (SELECT salon_id FROM public.customers WHERE id = auth.uid())
      )
  ));

CREATE POLICY "Update appointment services if can edit appointment"
  ON public.appointment_services FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        (a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id())
        OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'))
      )
  ));

CREATE POLICY "Delete appointment services if can edit appointment"
  ON public.appointment_services FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_services.appointment_id
      AND (
        (a.professional_id = auth.uid() AND a.salon_id = public.get_user_salon_id())
        OR (a.salon_id = public.get_user_salon_id() AND public.has_role(auth.uid(), 'manager'))
      )
  ));

CREATE INDEX idx_appointment_services_appointment_id ON public.appointment_services(appointment_id);

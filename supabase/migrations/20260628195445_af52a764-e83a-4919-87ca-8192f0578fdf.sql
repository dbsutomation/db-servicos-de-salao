ALTER TABLE public.appointments
  ADD COLUMN started_at timestamptz,
  ADD COLUMN completed_at timestamptz;

ALTER TABLE public.appointments
  DROP CONSTRAINT appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE public.service_records
  ADD COLUMN appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX idx_service_records_appointment_id
  ON public.service_records(appointment_id);
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('pending','scheduled','confirmed','in_progress','completed','cancelled'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
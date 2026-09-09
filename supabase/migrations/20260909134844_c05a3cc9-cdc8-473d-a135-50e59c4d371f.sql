CREATE OR REPLACE FUNCTION public.is_salon_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH user_salons AS (
    SELECT u.salon_id
    FROM public.users AS u
    WHERE u.id = auth.uid()

    UNION

    SELECT c.salon_id
    FROM public.customers AS c
    WHERE c.id = auth.uid()
  ), resolved AS (
    SELECT count(*) AS salon_count, max(salon_id::text)::uuid AS salon_id
    FROM user_salons
  )
  SELECT COALESCE(
    resolved.salon_count = 1
    AND EXISTS (
      SELECT 1
      FROM public.salons AS s
      WHERE s.id = resolved.salon_id
        AND s.status = 'ativo'
    ),
    false
  )
  FROM resolved;
$$;

REVOKE ALL ON FUNCTION public.is_salon_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_salon_active() TO authenticated, service_role;
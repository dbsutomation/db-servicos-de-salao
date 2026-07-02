
DROP VIEW IF EXISTS public.salons_public;

REVOKE SELECT ON public.salons FROM anon;
GRANT SELECT (id, name) ON public.salons TO anon;

DROP POLICY IF EXISTS "Anon can view active salons id and name" ON public.salons;
CREATE POLICY "Anon can view active salons id and name"
ON public.salons FOR SELECT TO anon
USING (is_active = true);

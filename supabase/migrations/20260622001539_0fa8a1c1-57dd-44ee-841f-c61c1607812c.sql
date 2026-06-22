-- Permitir que visitantes anônimos leiam informações básicas do salão no autocadastro
GRANT SELECT ON public.salons TO anon;

CREATE POLICY "Anon users can view salon info for customer signup"
  ON public.salons FOR SELECT TO anon
  USING (is_active = true);

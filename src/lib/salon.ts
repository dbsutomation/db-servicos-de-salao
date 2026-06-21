import { supabase } from '@/integrations/supabase/client';

let cachedSalonId: string | null = null;

/**
 * Returns the salon_id of the currently authenticated user.
 * Cached for the session.
 */
export async function getCurrentSalonId(): Promise<string> {
  if (cachedSalonId) return cachedSalonId;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('users')
    .select('salon_id')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  const salonId = (data as any)?.salon_id as string | undefined;
  if (!salonId) throw new Error('Salão do usuário não encontrado');

  cachedSalonId = salonId;
  return salonId;
}

export function clearSalonCache() {
  cachedSalonId = null;
}

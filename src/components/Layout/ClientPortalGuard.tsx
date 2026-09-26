import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabaseClient } from '@/integrations/supabase/client';

export default function ClientPortalGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'login' | 'unavailable' | 'ready'>('loading');

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!active) return;
      if (!user) { setStatus('login'); return; }
      const { data: customer } = await supabaseClient.from('customers').select('salon_id').eq('id', user.id).maybeSingle();
      if (!active) return;
      if (!customer) { setStatus('unavailable'); return; }
      const { data: salon } = await supabaseClient.from('salons').select('feature_agenda, status').eq('id', customer.salon_id).maybeSingle();
      if (active) setStatus(salon?.feature_agenda && salon.status === 'ativo' ? 'ready' : 'unavailable');
    };
    check();
    return () => { active = false; };
  }, []);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  if (status === 'login') return <Navigate to="/login-cliente" replace />;
  if (status === 'unavailable') return <div className="min-h-screen flex items-center justify-center p-6 text-center text-muted-foreground">Agendamentos indisponíveis para este salão.</div>;
  return children;
}
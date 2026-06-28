import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentSalonId } from '@/lib/salon';

export function usePendingAppointmentsCount() {
  const { currentUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;
    let salonIdRef: string | null = null;

    const fetchCount = async (salonId: string) => {
      let q = supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('salon_id', salonId)
        .in('status', ['pending', 'scheduled']);
      if (!currentUser.isManager) {
        q = q.eq('professional_id', currentUser.id);
      }
      const { count: c } = await q;
      if (!cancelled) setCount(c ?? 0);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      try {
        const salonId = await getCurrentSalonId();
        salonIdRef = salonId;
        await fetchCount(salonId);

        channel = supabase
          .channel(`appointments-pending-${currentUser.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments', filter: `salon_id=eq.${salonId}` },
            () => { if (salonIdRef) fetchCount(salonIdRef); }
          )
          .subscribe();
      } catch (e) { /* ignore */ }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.isManager]);

  return count;
}

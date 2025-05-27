
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockedPeriod {
  id: string;
  professional_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export const useBlockedPeriods = (professionalId: string | null, weekStart: Date, weekEnd: Date) => {
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBlockedPeriods = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_periods')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('start_date', weekStart.toISOString().split('T')[0])
        .lte('end_date', weekEnd.toISOString().split('T')[0]);

      if (error) throw error;

      setBlockedPeriods(data || []);
    } catch (error) {
      console.error('Erro ao buscar períodos bloqueados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os períodos bloqueados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedPeriods();
  }, [professionalId, weekStart, weekEnd]);

  const isSlotBlocked = (date: string, time: string): boolean => {
    return blockedPeriods.some(period => {
      const periodStartDate = period.start_date;
      const periodEndDate = period.end_date;
      const periodStartTime = period.start_time.substring(0, 5);
      const periodEndTime = period.end_time.substring(0, 5);
      
      // Verificar se a data está dentro do período bloqueado
      const isDateInRange = date >= periodStartDate && date <= periodEndDate;
      
      // Verificar se o horário está dentro do período bloqueado
      const isTimeInRange = time >= periodStartTime && time < periodEndTime;
      
      return isDateInRange && isTimeInRange;
    });
  };

  return {
    blockedPeriods,
    loading,
    fetchBlockedPeriods,
    isSlotBlocked
  };
};

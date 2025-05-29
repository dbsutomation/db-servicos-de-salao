
/**
 * Hook para gerenciamento de períodos bloqueados na agenda
 * 
 * Permite bloquear horários específicos para um profissional,
 * considerando sempre o fuso horário de Brasília
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatBrasiliaDate } from '@/utils/timezoneUtils';

// Interface para períodos bloqueados
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

  /**
   * Busca períodos bloqueados para o profissional e intervalo de datas
   * Considera o fuso horário de Brasília para as datas
   */
  const fetchBlockedPeriods = async () => {
    if (!professionalId) return;

    setLoading(true);
    try {
      // Formata as datas para busca no banco (formato YYYY-MM-DD)
      const startDateStr = formatBrasiliaDate(weekStart, 'yyyy-MM-dd');
      const endDateStr = formatBrasiliaDate(weekEnd, 'yyyy-MM-dd');
      
      console.log('🔍 Buscando períodos bloqueados para:', {
        professionalId,
        periodo: `${startDateStr} até ${endDateStr}`,
        timezone: 'America/Sao_Paulo (UTC-3)'
      });

      const { data, error } = await supabase
        .from('blocked_periods')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('start_date', startDateStr)
        .lte('end_date', endDateStr);

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} períodos bloqueados encontrados`);
      
      setBlockedPeriods(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar períodos bloqueados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os períodos bloqueados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Recarrega períodos quando profissional ou período muda
  useEffect(() => {
    fetchBlockedPeriods();
  }, [professionalId, weekStart, weekEnd]);

  /**
   * Verifica se um slot específico está bloqueado
   * 
   * @param date - Data do slot (YYYY-MM-DD)
   * @param time - Horário do slot (HH:MM)
   * @returns boolean - True se o slot está bloqueado
   */
  const isSlotBlocked = (date: string, time: string): boolean => {
    const isBlocked = blockedPeriods.some(period => {
      const periodStartDate = period.start_date;
      const periodEndDate = period.end_date;
      const periodStartTime = period.start_time.substring(0, 5); // Remove segundos se existir
      const periodEndTime = period.end_time.substring(0, 5); // Remove segundos se existir
      
      // Verifica se a data está dentro do período bloqueado
      const isDateInRange = date >= periodStartDate && date <= periodEndDate;
      
      // Verifica se o horário está dentro do período bloqueado
      const isTimeInRange = time >= periodStartTime && time < periodEndTime;
      
      const result = isDateInRange && isTimeInRange;
      
      if (result) {
        console.log('🚫 Slot bloqueado encontrado:', {
          slot: `${date} ${time}`,
          periodo_bloqueado: `${periodStartDate} ${periodStartTime} - ${periodEndDate} ${periodEndTime}`,
          motivo: period.reason || 'Não especificado'
        });
      }
      
      return result;
    });

    return isBlocked;
  };

  return {
    blockedPeriods,
    loading,
    fetchBlockedPeriods,
    isSlotBlocked
  };
};

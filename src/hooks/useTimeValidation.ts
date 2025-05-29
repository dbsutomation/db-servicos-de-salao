
/**
 * Hook para validações relacionadas a tempo e fuso horário
 * 
 * Centraliza todas as validações de data/hora para garantir
 * consistência no uso do fuso horário de Brasília
 */

import { isToday, isBefore, startOfDay } from 'date-fns';
import { 
  isPastInBrasilia, 
  getBrasiliaDate, 
  toBrasiliaTime,
  isValidTimeString 
} from '@/utils/timezoneUtils';

export const useTimeValidation = () => {
  /**
   * Verifica se uma data é anterior ao dia atual (no fuso horário de Brasília)
   * @param date - Data para verificar
   * @returns boolean - True se é data passada
   */
  const isPastDate = (date: Date): boolean => {
    const today = getBrasiliaDate();
    const targetDate = toBrasiliaTime(date);
    
    // Compara apenas as datas (ignorando horário)
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    return targetOnly < todayOnly;
  };

  /**
   * Verifica se um slot de horário específico já passou
   * Considera tanto a data quanto o horário no fuso de Brasília
   * 
   * @param date - Data do slot
   * @param time - Horário do slot (HH:MM)
   * @returns boolean - True se já passou
   */
  const isPastTimeSlot = (date: Date, time: string): boolean => {
    return isPastInBrasilia(date, time);
  };

  /**
   * Valida se é possível agendar em um slot específico
   * Retorna informações detalhadas sobre a validação
   * 
   * @param dateString - Data no formato YYYY-MM-DD
   * @param time - Horário no formato HH:MM
   * @returns Object - { isValid: boolean, message?: string }
   */
  const validateSlotClick = (dateString: string, time: string): { isValid: boolean; message?: string } => {
    // Validações básicas de formato
    if (!dateString || !time) {
      return {
        isValid: false,
        message: "Data ou horário inválido."
      };
    }

    if (!isValidTimeString(time)) {
      return {
        isValid: false,
        message: "Formato de horário inválido."
      };
    }

    // Converte a data selecionada para o fuso horário de Brasília
    const selectedDate = new Date(dateString + 'T00:00:00');
    const brasiliaSelectedDate = toBrasiliaTime(selectedDate);
    const today = startOfDay(getBrasiliaDate());

    // Verifica se é uma data passada (não hoje)
    if (isBefore(brasiliaSelectedDate, today)) {
      return {
        isValid: false,
        message: "Não é possível agendar em datas passadas."
      };
    }

    // Se é hoje, verifica se o horário já passou
    if (isToday(brasiliaSelectedDate)) {
      const now = getBrasiliaDate();
      const [hours, minutes] = time.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return {
          isValid: false,
          message: "Horário inválido."
        };
      }

      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const slotTotalMinutes = hours * 60 + minutes;

      if (slotTotalMinutes <= currentTotalMinutes) {
        return {
          isValid: false,
          message: "Não é possível agendar em horários que já passaram."
        };
      }
    }

    return { isValid: true };
  };

  return {
    isPastDate,
    isPastTimeSlot,
    validateSlotClick
  };
};

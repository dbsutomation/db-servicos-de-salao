
import { isToday, isBefore, startOfDay } from 'date-fns';

export const useTimeValidation = () => {
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return dateOnly < todayOnly;
  };

  const isPastTimeSlot = (date: Date, time: string): boolean => {
    // Se não é hoje, verificar se é data passada
    if (!isToday(date)) {
      return isPastDate(date);
    }
    
    // Se é hoje, verificar horário
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const slotTotalMinutes = hours * 60 + minutes;
    
    return slotTotalMinutes <= currentTotalMinutes;
  };

  const validateSlotClick = (dateString: string, time: string): { isValid: boolean; message?: string } => {
    const selectedDate = new Date(dateString + 'T00:00:00');
    const today = startOfDay(new Date());

    // Verificar se é uma data passada (não hoje)
    if (isBefore(selectedDate, today)) {
      return {
        isValid: false,
        message: "Não é possível agendar em datas passadas."
      };
    }

    // Se é hoje, verificar se o horário já passou
    if (isToday(selectedDate)) {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
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


import { isToday, isSameDay } from 'date-fns';
import { Appointment } from '@/types';

// Validação de dados de tempo
export const validateTimeData = (time: string): boolean => {
  if (!time || typeof time !== 'string') return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
};

// Extrair horário seguro
export const safeTimeExtraction = (time: string, fallback: string = '00:00'): string => {
  if (!validateTimeData(time)) return fallback;
  return time.substring(0, 5);
};

// Verificar se um slot de horário já passou
export const isPastTimeSlot = (date: Date, time: string): boolean => {
  if (!validateTimeData(time)) return true;
  
  const today = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Se não é hoje, verificar se é data passada
  if (dateOnly < todayOnly) return true;
  
  // Se é hoje, verificar horário
  if (isToday(date)) {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return true;
    
    const currentTotalMinutes = today.getHours() * 60 + today.getMinutes();
    const slotTotalMinutes = hours * 60 + minutes;
    
    return slotTotalMinutes <= currentTotalMinutes;
  }
  
  return false;
};

// Obter agendamentos para um slot específico
export const getAppointmentsForSlot = (
  appointments: Appointment[], 
  date: Date, 
  time: string
): Appointment[] => {
  if (!validateTimeData(time) || !appointments?.length) return [];
  
  return appointments.filter(appointment => {
    if (!appointment?.appointment_date || !appointment?.start_time || !appointment?.end_time) {
      return false;
    }
    
    try {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = safeTimeExtraction(appointment.start_time);
      const appointmentEndTime = safeTimeExtraction(appointment.end_time);
      
      const isSameDate = isSameDay(appointmentDate, date);
      const isTimeInRange = time >= appointmentStartTime && time < appointmentEndTime;
      
      return isSameDate && isTimeInRange;
    } catch (error) {
      console.warn('Erro ao processar agendamento:', error);
      return false;
    }
  });
};

// Verificar se é o primeiro slot de um agendamento
export const isFirstSlotOfAppointment = (time: string, appointment: Appointment): boolean => {
  if (!appointment?.start_time || !validateTimeData(time)) return false;
  
  const appointmentStartTime = safeTimeExtraction(appointment.start_time);
  return time === appointmentStartTime;
};

// Verificar se um agendamento já passou
export const isPastAppointment = (appointment: Appointment): boolean => {
  if (!appointment?.appointment_date || !appointment?.start_time) return true;
  
  try {
    const appointmentDate = new Date(appointment.appointment_date);
    const today = new Date();
    const dateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dateOnly < todayOnly) return true;
    
    if (isSameDay(appointmentDate, today)) {
      const startTime = safeTimeExtraction(appointment.start_time);
      const [hours, minutes] = startTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) return true;
      
      const currentTotalMinutes = today.getHours() * 60 + today.getMinutes();
      const appointmentTotalMinutes = hours * 60 + minutes;
      return appointmentTotalMinutes <= currentTotalMinutes;
    }
    
    return false;
  } catch (error) {
    console.warn('Erro ao verificar se agendamento passou:', error);
    return true;
  }
};

// Gerar horários de trabalho
export const generateWorkingHours = (): string[] => {
  return Array.from({ length: 22 }, (_, i) => {
    const baseHour = 8 + Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
};

// Gerar horários principais (de hora em hora)
export const generateMainHours = (): string[] => {
  return Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
};


import { isToday, isSameDay, parseISO, isValid } from 'date-fns';
import { Appointment } from '@/types';
import { 
  WORKING_HOURS_CONFIG, 
  isValidTimeString, 
  isValidAppointmentData,
  sanitizeTimeString 
} from './scheduleValidation';

// Cache para horários de trabalho
let workingHoursCache: string[] | null = null;
let mainHoursCache: string[] | null = null;

export const generateWorkingHours = (): string[] => {
  if (workingHoursCache) return workingHoursCache;
  
  workingHoursCache = Array.from({ length: WORKING_HOURS_CONFIG.TOTAL_SLOTS }, (_, i) => {
    const baseHour = WORKING_HOURS_CONFIG.START_HOUR + Math.floor(i / 2);
    const minutes = (i % 2) * WORKING_HOURS_CONFIG.SLOT_DURATION;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
  
  return workingHoursCache;
};

export const generateMainHours = (): string[] => {
  if (mainHoursCache) return mainHoursCache;
  
  const totalHours = WORKING_HOURS_CONFIG.END_HOUR - WORKING_HOURS_CONFIG.START_HOUR + 1;
  mainHoursCache = Array.from({ length: totalHours }, (_, i) => {
    const hour = WORKING_HOURS_CONFIG.START_HOUR + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  return mainHoursCache;
};

export const isPastTimeSlot = (date: Date, time: string): boolean => {
  if (!isValid(date) || !isValidTimeString(time)) return true;
  
  const today = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Data passada
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

export const getAppointmentsForSlot = (
  appointments: Appointment[], 
  date: Date, 
  time: string
): Appointment[] => {
  if (!isValid(date) || !isValidTimeString(time) || !Array.isArray(appointments)) {
    return [];
  }
  
  return appointments.filter(appointment => {
    if (!isValidAppointmentData(appointment)) return false;
    
    try {
      const appointmentDate = parseISO(appointment.appointment_date);
      const appointmentStartTime = sanitizeTimeString(appointment.start_time);
      const appointmentEndTime = sanitizeTimeString(appointment.end_time);
      
      return isSameDay(appointmentDate, date) && 
             time >= appointmentStartTime && 
             time < appointmentEndTime;
    } catch (error) {
      console.warn('Erro ao processar agendamento:', error);
      return false;
    }
  });
};

export const isFirstSlotOfAppointment = (time: string, appointment: Appointment): boolean => {
  if (!isValidTimeString(time) || !isValidAppointmentData(appointment)) return false;
  
  const appointmentStartTime = sanitizeTimeString(appointment.start_time);
  return time === appointmentStartTime;
};

export const isPastAppointment = (appointment: Appointment): boolean => {
  if (!isValidAppointmentData(appointment)) return true;
  
  try {
    const appointmentDate = parseISO(appointment.appointment_date);
    return isPastTimeSlot(appointmentDate, appointment.start_time);
  } catch (error) {
    console.warn('Erro ao verificar se agendamento passou:', error);
    return true;
  }
};


import { isValid, parseISO } from 'date-fns';

// Constantes para configuração
export const WORKING_HOURS_CONFIG = {
  START_HOUR: 8,
  END_HOUR: 19,
  SLOT_DURATION: 30, // minutos
  TOTAL_SLOTS: 22
} as const;

export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
export const DATE_FORMAT = 'yyyy-MM-dd';

// Validações básicas
export const isValidTimeString = (time: string): boolean => {
  return typeof time === 'string' && TIME_REGEX.test(time);
};

export const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = parseISO(dateString);
  return isValid(date);
};

export const isValidAppointmentData = (appointment: any): boolean => {
  return (
    appointment &&
    typeof appointment === 'object' &&
    isValidDateString(appointment.appointment_date) &&
    isValidTimeString(appointment.start_time) &&
    isValidTimeString(appointment.end_time)
  );
};

// Sanitização de dados
export const sanitizeTimeString = (time: string, fallback: string = '00:00'): string => {
  if (!isValidTimeString(time)) return fallback;
  return time.substring(0, 5);
};

export const sanitizeDateString = (dateString: string): string | null => {
  if (!isValidDateString(dateString)) return null;
  return dateString;
};

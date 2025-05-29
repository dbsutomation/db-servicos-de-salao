
/**
 * Validações específicas para o sistema de agendamento
 * 
 * Contém validações, sanitizações e configurações
 * relacionadas ao funcionamento da agenda
 */

import { isValid, parseISO } from 'date-fns';

// Configurações dos horários de funcionamento
export const WORKING_HOURS_CONFIG = {
  START_HOUR: 8,      // Início do atendimento: 8h
  END_HOUR: 19,       // Fim do atendimento: 19h
  SLOT_DURATION: 30,  // Duração de cada slot: 30 minutos
  TOTAL_SLOTS: 22     // Total de slots de 30min entre 8h e 19h
} as const;

// Regex para validação de horário no formato HH:MM ou HH:MM:SS
export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// Formato padrão para datas
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Valida se uma string de horário está no formato correto (HH:MM)
 * @param time - String do horário para validar
 * @returns boolean - True se válido
 */
export const isValidTimeString = (time: string): boolean => {
  return typeof time === 'string' && TIME_REGEX.test(time);
};

/**
 * Valida se uma string de data está no formato correto (YYYY-MM-DD)
 * @param dateString - String da data para validar
 * @returns boolean - True se válido
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = parseISO(dateString);
  return isValid(date);
};

/**
 * Valida se um objeto de agendamento possui todos os campos obrigatórios
 * @param appointment - Objeto do agendamento para validar
 * @returns boolean - True se válido
 */
export const isValidAppointmentData = (appointment: any): boolean => {
  return (
    appointment &&
    typeof appointment === 'object' &&
    isValidDateString(appointment.appointment_date) &&
    isValidTimeString(appointment.start_time) &&
    isValidTimeString(appointment.end_time)
  );
};

/**
 * Remove segundos de uma string de horário, mantendo apenas HH:MM
 * Útil para padronizar horários vindos do banco de dados
 * 
 * @param time - Horário para sanitizar
 * @param fallback - Valor padrão se inválido
 * @returns string - Horário sanitizado no formato HH:MM
 */
export const sanitizeTimeString = (time: string, fallback: string = '00:00'): string => {
  if (!isValidTimeString(time)) return fallback;
  return time.substring(0, 5); // Mantém apenas HH:MM
};

/**
 * Sanitiza uma string de data, retornando null se inválida
 * @param dateString - String da data para sanitizar
 * @returns string | null - Data sanitizada ou null se inválida
 */
export const sanitizeDateString = (dateString: string): string | null => {
  if (!isValidDateString(dateString)) return null;
  return dateString;
};

/**
 * Valida se um horário está dentro do período de funcionamento
 * @param time - Horário para validar (HH:MM)
 * @returns boolean - True se está dentro do horário de funcionamento
 */
export const isWithinWorkingHours = (time: string): boolean => {
  if (!isValidTimeString(time)) return false;
  
  const [hours] = time.split(':').map(Number);
  return hours >= WORKING_HOURS_CONFIG.START_HOUR && hours <= WORKING_HOURS_CONFIG.END_HOUR;
};

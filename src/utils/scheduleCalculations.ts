
/**
 * Cálculos e validações para o sistema de agendamento
 * 
 * Este arquivo contém todas as funções relacionadas aos cálculos
 * de horários, validações e manipulações da agenda, sempre
 * considerando o fuso horário de Brasília (UTC-3)
 */

import { isSameDay, parseISO, isValid } from 'date-fns';
import { Appointment } from '@/types';
import { 
  isPastInBrasilia, 
  isValidDateString, 
  isValidTimeString,
  toBrasiliaTime 
} from './timezoneUtils';

// Configurações dos horários de funcionamento
export const WORKING_HOURS_CONFIG = {
  START_HOUR: 8,    // Início às 8h
  END_HOUR: 19,     // Fim às 19h
  SLOT_DURATION: 30, // Duração de cada slot em minutos
  TOTAL_SLOTS: 22   // Total de slots de 30min (8h às 19h)
} as const;

// Cache para otimizar performance dos horários gerados
let workingHoursCache: string[] | null = null;
let mainHoursCache: string[] | null = null;

/**
 * Gera todos os horários de trabalho (intervalos de 30 minutos)
 * Usado para validações e cálculos internos
 * @returns string[] - Array com todos os horários no formato HH:MM
 */
export const generateWorkingHours = (): string[] => {
  // Usa cache para melhorar performance
  if (workingHoursCache) return workingHoursCache;
  
  workingHoursCache = Array.from({ length: WORKING_HOURS_CONFIG.TOTAL_SLOTS }, (_, i) => {
    const baseHour = WORKING_HOURS_CONFIG.START_HOUR + Math.floor(i / 2);
    const minutes = (i % 2) * WORKING_HOURS_CONFIG.SLOT_DURATION;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });
  
  return workingHoursCache;
};

/**
 * Gera apenas os horários principais (hora cheia) para exibição na grade
 * Usado na interface visual da agenda
 * @returns string[] - Array com horários principais no formato HH:00
 */
export const generateMainHours = (): string[] => {
  // Usa cache para melhorar performance
  if (mainHoursCache) return mainHoursCache;
  
  const totalHours = WORKING_HOURS_CONFIG.END_HOUR - WORKING_HOURS_CONFIG.START_HOUR + 1;
  mainHoursCache = Array.from({ length: totalHours }, (_, i) => {
    const hour = WORKING_HOURS_CONFIG.START_HOUR + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  return mainHoursCache;
};

/**
 * Verifica se um slot de horário já passou considerando o fuso horário de Brasília
 * @param date - Data do slot
 * @param time - Horário do slot no formato HH:MM
 * @returns boolean - True se o slot já passou
 */
export const isPastTimeSlot = (date: Date, time: string): boolean => {
  // Validações básicas
  if (!isValid(date) || !isValidTimeString(time)) return true;
  
  // Usa a função centralizada de timezone
  return isPastInBrasilia(date, time);
};

/**
 * Busca todos os agendamentos que ocupam um slot específico
 * Um agendamento ocupa um slot se o horário do slot estiver entre
 * o horário de início e fim do agendamento
 * 
 * @param appointments - Lista de agendamentos
 * @param date - Data do slot
 * @param time - Horário do slot
 * @returns Appointment[] - Agendamentos que ocupam o slot
 */
export const getAppointmentsForSlot = (
  appointments: Appointment[], 
  date: Date, 
  time: string
): Appointment[] => {
  // Validações de entrada
  if (!isValid(date) || !isValidTimeString(time) || !Array.isArray(appointments)) {
    console.log('❌ Validação falhou:', { 
      dateValid: isValid(date), 
      timeValid: isValidTimeString(time), 
      appointmentsArray: Array.isArray(appointments),
      appointmentsLength: appointments?.length || 0
    });
    return [];
  }
  
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log('🔍 Procurando agendamentos para slot:', {
    dateString,
    time,
    totalAppointments: appointments.length
  });
  
  const matchingAppointments = appointments.filter(appointment => {
    // Validação dos dados do agendamento
    if (!isValidAppointmentData(appointment)) {
      console.log('❌ Dados de agendamento inválidos:', appointment);
      return false;
    }
    
    try {
      const appointmentDate = appointment.appointment_date;
      const appointmentStartTime = sanitizeTimeString(appointment.start_time);
      const appointmentEndTime = sanitizeTimeString(appointment.end_time);
      
      // Verifica se é o mesmo dia e se o horário está no intervalo
      const isSameDate = appointmentDate === dateString;
      const isTimeInRange = time >= appointmentStartTime && time < appointmentEndTime;
      
      const matches = isSameDate && isTimeInRange;
      
      console.log('🔍 Verificando agendamento:', {
        appointmentId: appointment.id,
        appointmentDate,
        appointmentStartTime,
        appointmentEndTime,
        slotDate: dateString,
        slotTime: time,
        isSameDate,
        isTimeInRange,
        matches
      });
      
      return matches;
    } catch (error) {
      console.warn('❌ Erro ao processar agendamento para slot:', error, appointment);
      return false;
    }
  });
  
  console.log(`✅ Slot ${dateString} ${time}: ${matchingAppointments.length} agendamentos encontrados`);
  return matchingAppointments;
};

/**
 * Verifica se um horário é o primeiro slot de um agendamento
 * Usado para determinar onde renderizar o componente completo do agendamento
 * 
 * @param time - Horário a verificar
 * @param appointment - Agendamento para comparar
 * @returns boolean - True se é o primeiro slot
 */
export const isFirstSlotOfAppointment = (time: string, appointment: Appointment): boolean => {
  if (!isValidTimeString(time) || !isValidAppointmentData(appointment)) return false;
  
  const appointmentStartTime = sanitizeTimeString(appointment.start_time);
  return time === appointmentStartTime;
};

/**
 * Verifica se um agendamento já passou (está no passado)
 * @param appointment - Agendamento para verificar
 * @returns boolean - True se o agendamento já passou
 */
export const isPastAppointment = (appointment: Appointment): boolean => {
  if (!isValidAppointmentData(appointment)) return true;
  
  try {
    const appointmentDate = parseISO(appointment.appointment_date + 'T00:00:00');
    return isPastTimeSlot(appointmentDate, appointment.start_time);
  } catch (error) {
    console.warn('❌ Erro ao verificar se agendamento passou:', error);
    return true;
  }
};

/**
 * Valida se os dados de um agendamento estão corretos
 * Corrigido para aceitar horários no formato HH:MM:SS que vem do banco
 * @param appointment - Agendamento para validar
 * @returns boolean - True se válido
 */
export const isValidAppointmentData = (appointment: any): boolean => {
  if (!appointment || typeof appointment !== 'object') {
    console.log('❌ Agendamento não é um objeto válido:', appointment);
    return false;
  }

  // Verifica se a data do agendamento está presente e no formato correto
  if (!appointment.appointment_date || 
      typeof appointment.appointment_date !== 'string' || 
      appointment.appointment_date.length !== 10) {
    console.log('❌ Data do agendamento inválida:', appointment.appointment_date);
    return false;
  }

  // Verifica se os horários estão presentes
  if (!appointment.start_time || !appointment.end_time) {
    console.log('❌ Horários ausentes:', {
      start_time: appointment.start_time,
      end_time: appointment.end_time
    });
    return false;
  }

  // Valida os horários - aceita tanto HH:MM quanto HH:MM:SS
  const startTimeValid = isValidTimeFormatFromDB(appointment.start_time);
  const endTimeValid = isValidTimeFormatFromDB(appointment.end_time);

  if (!startTimeValid || !endTimeValid) {
    console.log('❌ Formatos de horário inválidos:', {
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      startTimeValid,
      endTimeValid
    });
    return false;
  }

  console.log('✅ Dados de agendamento válidos:', {
    id: appointment.id,
    date: appointment.appointment_date,
    start_time: appointment.start_time,
    end_time: appointment.end_time
  });

  return true;
};

/**
 * Valida se um horário está no formato correto do banco de dados
 * Aceita tanto HH:MM quanto HH:MM:SS
 * @param time - Horário para validar
 * @returns boolean - True se válido
 */
export const isValidTimeFormatFromDB = (time: string): boolean => {
  if (!time || typeof time !== 'string') return false;
  
  // Regex para HH:MM ou HH:MM:SS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
};

/**
 * Remove segundos de uma string de horário, mantendo apenas HH:MM
 * @param time - Horário para sanitizar
 * @param fallback - Valor padrão se inválido
 * @returns string - Horário sanitizado
 */
export const sanitizeTimeString = (time: string, fallback: string = '00:00'): string => {
  if (!time || typeof time !== 'string') {
    console.log('⚠️ Horário inválido, usando fallback:', { time, fallback });
    return fallback;
  }
  
  // Remove segundos se existirem (HH:MM:SS -> HH:MM)
  const cleanTime = time.substring(0, 5);
  
  if (!isValidTimeString(cleanTime)) {
    console.log('⚠️ Horário sanitizado inválido, usando fallback:', { cleanTime, fallback });
    return fallback;
  }
  
  return cleanTime;
};

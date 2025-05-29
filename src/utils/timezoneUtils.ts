
/**
 * Utilitários para manipulação de timezone - Horário de Brasília (UTC-3)
 * 
 * Este arquivo centraliza todas as operações relacionadas a data/hora
 * garantindo que sempre usemos o fuso horário de Brasília consistentemente
 */

import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

// Constante para o fuso horário de Brasília
export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data/hora atual no fuso horário de Brasília
 * @returns Date - Data atual convertida para UTC-3
 */
export const getBrasiliaDate = (): Date => {
  return toZonedTime(new Date(), BRASILIA_TIMEZONE);
};

/**
 * Converte uma data UTC para o fuso horário de Brasília
 * @param date - Data em UTC para converter
 * @returns Date - Data convertida para Brasília
 */
export const toBrasiliaTime = (date: Date): Date => {
  return toZonedTime(date, BRASILIA_TIMEZONE);
};

/**
 * Converte uma data do fuso horário de Brasília para UTC
 * @param date - Data em horário de Brasília
 * @returns Date - Data convertida para UTC
 */
export const fromBrasiliaTime = (date: Date): Date => {
  return fromZonedTime(date, BRASILIA_TIMEZONE);
};

/**
 * Formata uma data para exibição considerando o fuso horário de Brasília
 * @param date - Data para formatar
 * @param formatString - Padrão de formatação
 * @returns string - Data formatada
 */
export const formatBrasiliaDate = (date: Date, formatString: string): string => {
  const brasiliaDate = toBrasiliaTime(date);
  return format(brasiliaDate, formatString, { locale: ptBR });
};

/**
 * Verifica se uma data/hora já passou considerando o fuso horário de Brasília
 * @param date - Data para verificar
 * @param time - Horário no formato HH:MM (opcional)
 * @returns boolean - True se a data/hora já passou
 */
export const isPastInBrasilia = (date: Date, time?: string): boolean => {
  const now = getBrasiliaDate();
  const targetDate = toBrasiliaTime(date);
  
  // Se apenas data foi fornecida, compara apenas a data
  if (!time) {
    const todayStr = format(now, 'yyyy-MM-dd');
    const targetStr = format(targetDate, 'yyyy-MM-dd');
    return targetStr < todayStr;
  }
  
  // Se horário também foi fornecido, compara data e hora
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return true;
  
  // Define o horário na data alvo
  targetDate.setHours(hours, minutes, 0, 0);
  
  return targetDate < now;
};

/**
 * Obtém a data atual de Brasília no formato YYYY-MM-DD
 * @returns string - Data atual formatada
 */
export const getCurrentBrasiliaDateString = (): string => {
  return format(getBrasiliaDate(), 'yyyy-MM-dd');
};

/**
 * Obtém o horário atual de Brasília no formato HH:MM
 * @returns string - Horário atual formatado
 */
export const getCurrentBrasiliaTimeString = (): string => {
  return format(getBrasiliaDate(), 'HH:mm');
};

/**
 * Verifica se uma string de data é válida
 * @param dateString - String da data para validar
 * @returns boolean - True se válida
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = parseISO(dateString);
  return isValid(date);
};

/**
 * Verifica se uma string de horário é válida (formato HH:MM)
 * @param timeString - String do horário para validar
 * @returns boolean - True se válida
 */
export const isValidTimeString = (timeString: string): boolean => {
  if (!timeString || typeof timeString !== 'string') return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

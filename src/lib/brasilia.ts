/**
 * Utilitários de timezone para Brasília (UTC-3).
 *
 * O Supabase/PostgreSQL sempre armazena timestamps em UTC.
 * Estas funções fazem a conversão para exibição e cálculos
 * no horário de Brasília sem depender do fuso do browser.
 *
 * Uso:
 *   import { toBR, formatBR, toMinBR, dayRangeBR } from '@/lib/brasilia';
 */

import { format as dateFnsFormat } from 'date-fns';

const OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3 em millisegundos

/**
 * Converte um Date UTC para um Date "virtual" em horário de Brasília.
 * Útil para passar para funções do date-fns que usam horário local.
 *
 * Exemplo: toBR(new Date('2026-07-02T12:00:00Z')) → Date representando 09:00
 */
export const toBR = (d: Date): Date =>
  new Date(d.getTime() + OFFSET_MS);

/**
 * Formata um timestamp (string ISO ou Date) no horário de Brasília.
 *
 * Exemplo: formatBR('2026-07-02T12:00:00Z', 'HH:mm') → '09:00'
 */
export const formatBR = (
  d: Date | string,
  fmt: string,
  opts?: Parameters<typeof dateFnsFormat>[2]
): string => dateFnsFormat(toBR(new Date(d as string)), fmt, opts);

/**
 * Converte um Date UTC para minutos desde meia-noite em Brasília.
 * Útil para calcular posição de blocos na grade da agenda.
 *
 * Exemplo: toMinBR(new Date('2026-07-02T12:00:00Z')) → 540 (= 09:00)
 */
export const toMinBR = (d: Date): number => {
  const br = toBR(d);
  return br.getUTCHours() * 60 + br.getUTCMinutes();
};

/**
 * Retorna o range UTC de um dia completo em horário de Brasília.
 * Útil para queries no Supabase que filtram por dia.
 *
 * Exemplo: dayRangeBR('2026-07-02') → { from: '2026-07-02T03:00:00.000Z', to: '2026-07-03T02:59:59.000Z' }
 */
export const dayRangeBR = (dateStr: string) => ({
  from: new Date(`${dateStr}T00:00:00-03:00`).toISOString(),
  to:   new Date(`${dateStr}T23:59:59-03:00`).toISOString(),
});

/**
 * Verifica se um timestamp UTC corresponde ao dia atual em Brasília.
 */
export const isTodayBR = (d: Date): boolean => {
  const br = toBR(d);
  const nowBR = toBR(new Date());
  return (
    br.getUTCFullYear() === nowBR.getUTCFullYear() &&
    br.getUTCMonth() === nowBR.getUTCMonth() &&
    br.getUTCDate() === nowBR.getUTCDate()
  );
};

/**
 * Retorna a hora atual em Brasília como Date (para comparações de "passado").
 */
export const nowBR = (): Date => toBR(new Date());


import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GridCell } from './GridCell';

interface GridHeaderProps {
  weekDays: Date[];
}

export const GridHeader = ({ weekDays }: GridHeaderProps) => {
  return (
    <div className="grid bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: '140px repeat(6, 1fr)' }}>
      <GridCell className="text-sm font-semibold text-gray-700 bg-white min-h-[70px] flex items-center justify-center">
        Horário
      </GridCell>
      {weekDays.map((day) => (
        <GridCell key={day.toISOString()} className="text-center min-h-[70px] flex flex-col justify-center">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
            {format(day, 'EEEE', { locale: ptBR })}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {format(day, 'd')}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {format(day, 'dd/MM', { locale: ptBR })}
          </div>
        </GridCell>
      ))}
    </div>
  );
};

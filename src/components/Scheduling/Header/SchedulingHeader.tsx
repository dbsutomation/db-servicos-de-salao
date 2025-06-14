
import React from 'react';
import { Button } from '@/components/ui/button';
import { WeekNavigation } from '../Navigation/WeekNavigation';
import { CalendarOff } from 'lucide-react';
import { TeamMember } from '@/types';

interface SchedulingHeaderProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
  professionalData: TeamMember | undefined;
  onBlockPeriodClick: () => void;
  isMobile: boolean;
}

/**
 * Componente de header da agenda que adapta sua renderização para mobile e desktop
 * Evita duplicação de código entre as versões mobile e desktop
 */
export const SchedulingHeader = ({
  currentWeek,
  onWeekChange,
  professionalData,
  onBlockPeriodClick,
  isMobile
}: SchedulingHeaderProps) => {
  if (isMobile) {
    return (
      <div className="p-4 border-b border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Agenda de {professionalData?.name || 'Profissional'}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onBlockPeriodClick}
          className="w-full flex items-center justify-center space-x-2"
        >
          <CalendarOff className="h-4 w-4" />
          <span>Bloquear Período</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <WeekNavigation
        currentWeek={currentWeek}
        onWeekChange={onWeekChange}
        professionalName={professionalData?.name}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={onBlockPeriodClick}
        className="flex items-center space-x-2"
      >
        <CalendarOff className="h-4 w-4" />
        <span>Bloquear Período</span>
      </Button>
    </div>
  );
};

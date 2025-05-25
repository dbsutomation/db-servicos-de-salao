
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekNavigationProps {
  currentWeek: Date;
  onWeekChange: (newWeek: Date) => void;
  professionalName?: string;
}

const WeekNavigation = ({ currentWeek, onWeekChange, professionalName }: WeekNavigationProps) => {
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    onWeekChange(newWeek);
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg md:text-xl font-semibold">
        {professionalName ? `Agenda de ${professionalName}` : 'Agenda'}
      </h2>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateWeek('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[200px] text-center">
          {format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd/MM', { locale: ptBR })} - {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateWeek('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeekNavigation;


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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

  return (
    <div className="flex items-center justify-between bg-white p-4 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
        {professionalName ? `Agenda de ${professionalName}` : 'Agenda'}
      </h2>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
          {format(weekStart, 'dd', { locale: ptBR })} - {format(weekEnd, 'dd MMMM yyyy', { locale: ptBR })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateWeek('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeekNavigation;


import React, { useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateWorkingHours, getAppointmentsForSlot, isPastTimeSlot } from '@/utils/scheduleCalculations';

interface MobileScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  loading: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MobileScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  loading,
  selectedDate,
  onDateChange
}: MobileScheduleGridProps) => {
  // Memoização dos cálculos
  const { weekDays, workingHours } = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 1));
    
    return {
      weekDays: days,
      workingHours: generateWorkingHours()
    };
  }, [currentWeek]);

  const getSlotStatus = useCallback((date: Date, time: string) => {
    const slotAppointments = getAppointmentsForSlot(appointments, date, time);
    const isOccupied = slotAppointments.length > 0;
    const isPast = isPastTimeSlot(date, time);
    
    if (isOccupied) {
      return {
        variant: "secondary" as const,
        className: 'bg-blue-100 text-blue-700 cursor-not-allowed text-xs',
        disabled: true,
        text: 'Ocupado'
      };
    }
    
    if (isPast) {
      return {
        variant: "outline" as const,
        className: 'bg-gray-100 text-gray-400 cursor-not-allowed text-xs',
        disabled: true,
        text: 'Passado'
      };
    }
    
    return {
      variant: "outline" as const,
      className: 'hover:bg-green-100 hover:text-green-700 text-xs active:bg-green-200',
      disabled: false,
      text: 'Livre'
    };
  }, [appointments]);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    const currentIndex = weekDays.findIndex(day => isSameDay(day, selectedDate));
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : weekDays.length - 1;
    } else {
      newIndex = currentIndex < weekDays.length - 1 ? currentIndex + 1 : 0;
    }
    
    onDateChange(weekDays[newIndex]);
  }, [weekDays, selectedDate, onDateChange]);

  const handleSlotClick = useCallback((time: string) => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    onSlotClick(dateString, time);
  }, [selectedDate, onSlotClick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="sr-only">Carregando agenda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navegação do dia atual */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <CardTitle className="text-lg">
                {format(selectedDate, 'EEEE', { locale: ptBR })}
              </CardTitle>
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay('next')}
              className="h-8 w-8"
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Seletor de dias em tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {weekDays.map((day) => (
          <Button
            key={day.toISOString()}
            variant={isSameDay(day, selectedDate) ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 flex flex-col h-auto py-2 px-3"
            onClick={() => onDateChange(day)}
            aria-label={`Selecionar ${format(day, 'EEEE, dd/MM', { locale: ptBR })}`}
          >
            <span className="text-xs">
              {format(day, 'EEE', { locale: ptBR })}
            </span>
            <span className="text-xs">
              {format(day, 'dd/MM', { locale: ptBR })}
            </span>
          </Button>
        ))}
      </div>

      {/* Grid de horários para o dia selecionado */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {workingHours.map((time) => {
              const buttonProps = getSlotStatus(selectedDate, time);

              return (
                <Button
                  key={time}
                  variant={buttonProps.variant}
                  size="sm"
                  className={`h-12 ${buttonProps.className} flex flex-col justify-center touch-manipulation`}
                  disabled={buttonProps.disabled}
                  onClick={() => !buttonProps.disabled && handleSlotClick(time)}
                  aria-label={`${time} - ${buttonProps.text}`}
                >
                  <span className="font-medium">{time}</span>
                  <span className="text-xs opacity-80">{buttonProps.text}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileScheduleGrid;

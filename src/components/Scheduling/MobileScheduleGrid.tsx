
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 2));
  
  // Horários de funcionamento (8:00 às 19:00) com intervalos de 30 minutos
  const workingHours = Array.from({ length: 22 }, (_, i) => {
    const baseHour = 8 + Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const isSlotOccupied = (date: Date, time: string) => {
    return appointments.some(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      return isSameDay(appointmentDate, date) && 
             time >= appointmentStartTime && 
             time < appointmentEndTime;
    });
  };

  const isPastTimeSlot = (date: Date, time: string) => {
    if (!isToday(date)) {
      const today = new Date();
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dateOnly < todayOnly;
    }
    
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const slotTotalMinutes = hours * 60 + minutes;
    
    return slotTotalMinutes <= currentTotalMinutes;
  };

  const getSlotButtonProps = (date: Date, time: string) => {
    const isOccupied = isSlotOccupied(date, time);
    const isPast = isPastTimeSlot(date, time);
    
    if (isOccupied) {
      return {
        variant: "secondary" as const,
        className: 'bg-red-100 text-red-700 cursor-not-allowed text-xs',
        disabled: true,
        text: 'Ocupado'
      };
    }
    
    if (isPast) {
      return {
        variant: "outline" as const,
        className: 'bg-red-500 text-white cursor-not-allowed text-xs',
        disabled: true,
        text: '—'
      };
    }
    
    return {
      variant: "outline" as const,
      className: 'hover:bg-green-100 hover:text-green-700 text-xs',
      disabled: false,
      text: 'Livre'
    };
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = weekDays.findIndex(day => isSameDay(day, selectedDate));
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : weekDays.length - 1;
    } else {
      newIndex = currentIndex < weekDays.length - 1 ? currentIndex + 1 : 0;
    }
    
    onDateChange(weekDays[newIndex]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de dias para mobile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDay('prev')}
              className="h-8 w-8"
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
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Selector de dias em tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {weekDays.map((day) => (
          <Button
            key={day.toISOString()}
            variant={isSameDay(day, selectedDate) ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 flex flex-col h-auto py-2 px-3"
            onClick={() => onDateChange(day)}
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
              const dateString = format(selectedDate, 'yyyy-MM-dd');
              const buttonProps = getSlotButtonProps(selectedDate, time);

              return (
                <Button
                  key={`${dateString}-${time}`}
                  variant={buttonProps.variant}
                  size="sm"
                  className={`h-12 ${buttonProps.className} flex flex-col justify-center`}
                  disabled={buttonProps.disabled}
                  onClick={() => !buttonProps.disabled && onSlotClick(dateString, time)}
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

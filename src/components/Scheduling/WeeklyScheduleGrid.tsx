
import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointment: Appointment) => void;
  loading: boolean;
  isSlotBlocked?: (date: string, time: string) => boolean;
}

const WeeklyScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  onEditAppointment,
  onDeleteAppointment,
  loading,
  isSlotBlocked = () => false
}: WeeklyScheduleGridProps) => {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 2));
  
  // Horários de funcionamento (8:00 às 19:00) com intervalos de 30 minutos
  const workingHours = Array.from({ length: 22 }, (_, i) => {
    const baseHour = 8 + Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const getAppointmentsForSlot = (date: Date, time: string) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      return isSameDay(appointmentDate, date) && 
             time >= appointmentStartTime && 
             time < appointmentEndTime;
    });
  };

  const isSlotOccupied = (date: Date, time: string) => {
    return getAppointmentsForSlot(date, time).length > 0;
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
    const dateString = format(date, 'yyyy-MM-dd');
    const slotAppointments = getAppointmentsForSlot(date, time);
    const isOccupied = slotAppointments.length > 0;
    const isPast = isPastTimeSlot(date, time);
    const isBlocked = isSlotBlocked(dateString, time);
    
    if (isOccupied) {
      return {
        variant: "secondary" as const,
        className: 'bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 h-12 text-xs relative',
        disabled: false,
        appointments: slotAppointments
      };
    }

    if (isBlocked) {
      return {
        variant: "secondary" as const,
        className: 'bg-orange-100 text-orange-700 cursor-not-allowed h-12 text-xs',
        disabled: true,
        appointments: []
      };
    }
    
    if (isPast) {
      return {
        variant: "outline" as const,
        className: 'bg-gray-100 text-gray-400 cursor-not-allowed h-12 text-xs',
        disabled: true,
        appointments: []
      };
    }
    
    return {
      variant: "outline" as const,
      className: 'hover:bg-green-100 hover:text-green-700 h-12 text-xs',
      disabled: false,
      appointments: []
    };
  };

  const isPastAppointment = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.appointment_date);
    const today = new Date();
    const dateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (dateOnly < todayOnly) return true;
    
    if (isSameDay(appointmentDate, today)) {
      const now = new Date();
      const [hours, minutes] = appointment.start_time.split(':').map(Number);
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const appointmentTotalMinutes = hours * 60 + minutes;
      return appointmentTotalMinutes <= currentTotalMinutes;
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-6 gap-1 p-4">
        {/* Header com horários */}
        <div className="text-sm font-medium text-gray-600 p-2"></div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="text-center p-2 border-b">
            <div className="text-sm font-medium text-gray-900">
              {format(day, 'EEEE', { locale: ptBR })}
            </div>
            <div className="text-xs text-gray-500">
              {format(day, 'dd/MM', { locale: ptBR })}
            </div>
          </div>
        ))}

        {/* Grid de horários */}
        {workingHours.map((time) => (
          <React.Fragment key={time}>
            {/* Coluna de horários */}
            <div className="text-xs text-gray-600 p-2 text-right">
              {time}
            </div>
            
            {/* Colunas dos dias */}
            {weekDays.map((day) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const buttonProps = getSlotButtonProps(day, time);

              return (
                <div key={`${dateString}-${time}`} className="relative">
                  {buttonProps.appointments.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={buttonProps.className}>
                          <div className="text-xs font-medium truncate">
                            {buttonProps.appointments[0].client_name}
                          </div>
                          <div className="text-xs opacity-80 truncate">
                            {buttonProps.appointments[0].service_name}
                          </div>
                          
                          {/* Botões de ação */}
                          {!isPastAppointment(buttonProps.appointments[0]) && (
                            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditAppointment(buttonProps.appointments[0]);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-red-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAppointment(buttonProps.appointments[0]);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p><strong>Cliente:</strong> {buttonProps.appointments[0].client_name}</p>
                          <p><strong>Serviço:</strong> {buttonProps.appointments[0].service_name}</p>
                          <p><strong>Horário:</strong> {buttonProps.appointments[0].start_time.substring(0, 5)} - {buttonProps.appointments[0].end_time.substring(0, 5)}</p>
                          <p><strong>Valor:</strong> R$ {buttonProps.appointments[0].total_value}</p>
                          {buttonProps.appointments[0].notes && (
                            <p><strong>Observações:</strong> {buttonProps.appointments[0].notes}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant={buttonProps.variant}
                      size="sm"
                      className={buttonProps.className}
                      disabled={buttonProps.disabled}
                      onClick={() => !buttonProps.disabled && onSlotClick(dateString, time)}
                    >
                      {buttonProps.disabled && getSlotButtonProps(day, time).className.includes('orange') ? 'Bloqueado' : ''}
                    </Button>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default WeeklyScheduleGrid;

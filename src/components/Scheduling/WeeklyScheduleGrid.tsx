
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
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 1)); // Segunda a sexta
  
  // Horários de funcionamento (8:00 às 19:00) com intervalos de 30 minutos
  const workingHours = Array.from({ length: 22 }, (_, i) => {
    const baseHour = 8 + Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    return `${baseHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const getAppointmentsForSlot = (date: Date, time: string) => {
    console.log('Verificando slot:', format(date, 'yyyy-MM-dd'), time);
    console.log('Total de agendamentos:', appointments.length);
    
    const slotAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      const isSameDate = isSameDay(appointmentDate, date);
      const isTimeInRange = time >= appointmentStartTime && time < appointmentEndTime;
      
      console.log('Comparando agendamento:', {
        appointmentDate: format(appointmentDate, 'yyyy-MM-dd'),
        slotDate: format(date, 'yyyy-MM-dd'),
        appointmentStartTime,
        appointmentEndTime,
        slotTime: time,
        isSameDate,
        isTimeInRange,
        clientName: appointment.client_name
      });
      
      return isSameDate && isTimeInRange;
    });
    
    console.log('Agendamentos encontrados para slot:', slotAppointments.length);
    return slotAppointments;
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header da grade */}
        <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50">
          <div className="p-3 text-sm font-medium text-gray-600"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-3 text-center border-l border-gray-200">
              <div className="text-sm font-bold text-blue-600">
                {format(day, 'd')}
              </div>
              <div className="text-xs font-medium text-gray-900 uppercase">
                {format(day, 'EEEE', { locale: ptBR })}
              </div>
              <div className="text-xs text-gray-500">
                {format(day, 'dd/MM', { locale: ptBR })}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="max-h-96 overflow-y-auto">
          {workingHours.map((time) => (
            <div key={time} className="grid grid-cols-6 border-b border-gray-100 hover:bg-gray-50">
              {/* Coluna de horários */}
              <div className="p-2 text-xs font-medium text-gray-600 border-r border-gray-200 bg-gray-50">
                {time}
              </div>
              
              {/* Colunas dos dias */}
              {weekDays.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const slotAppointments = getAppointmentsForSlot(day, time);
                const isOccupied = slotAppointments.length > 0;
                const isPast = isPastTimeSlot(day, time);
                const isBlocked = isSlotBlocked(dateString, time);

                return (
                  <div key={`${dateString}-${time}`} className="relative border-l border-gray-200 h-12 group">
                    {isOccupied ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-200 h-full text-xs relative p-1">
                            <div className="font-semibold text-xs truncate">
                              {slotAppointments[0].client_name}
                            </div>
                            <div className="text-xs text-blue-600 truncate">
                              {slotAppointments[0].service_name}
                            </div>
                            <div className="text-xs text-blue-500">
                              {slotAppointments[0].start_time.substring(0, 5)} - {slotAppointments[0].end_time.substring(0, 5)}
                            </div>
                            
                            {/* Botões de ação */}
                            {!isPastAppointment(slotAppointments[0]) && (
                              <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 bg-white/90 hover:bg-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAppointment(slotAppointments[0]);
                                  }}
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 bg-white/90 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteAppointment(slotAppointments[0]);
                                  }}
                                >
                                  <Trash2 className="h-2 w-2 text-red-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p><strong>Cliente:</strong> {slotAppointments[0].client_name}</p>
                            <p><strong>Serviço:</strong> {slotAppointments[0].service_name}</p>
                            <p><strong>Horário:</strong> {slotAppointments[0].start_time.substring(0, 5)} - {slotAppointments[0].end_time.substring(0, 5)}</p>
                            <p><strong>Valor:</strong> R$ {slotAppointments[0].total_value}</p>
                            {slotAppointments[0].notes && (
                              <p><strong>Observações:</strong> {slotAppointments[0].notes}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        className={`w-full h-full text-xs transition-colors ${
                          isBlocked 
                            ? 'bg-orange-100 border-l-4 border-orange-400 text-orange-700 cursor-not-allowed' 
                            : isPast 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'hover:bg-green-50 hover:border-l-4 hover:border-green-400 cursor-pointer'
                        }`}
                        disabled={isBlocked || isPast}
                        onClick={() => !isBlocked && !isPast && onSlotClick(dateString, time)}
                      >
                        {isBlocked ? (
                          <span className="text-orange-600 font-medium">Bloqueado</span>
                        ) : (
                          ''
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WeeklyScheduleGrid;

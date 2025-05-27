
import React from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { useTimeValidation } from '@/hooks/useTimeValidation';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';

interface WeeklyScheduleGridProps {
  currentWeek: Date;
  appointments: Appointment[];
  onSlotClick: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  loading: boolean;
}

const WeeklyScheduleGrid = ({
  currentWeek,
  appointments,
  onSlotClick,
  onEditAppointment,
  loading
}: WeeklyScheduleGridProps) => {
  const { isPastTimeSlot } = useTimeValidation();
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i + 2));
  
  // Horários de funcionamento (8:00 às 19:00) com intervalos de 1 hora
  const workingHours = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const isSlotOccupied = (date: Date, time: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const occupied = appointments.some(appointment => {
      const appointmentDate = appointment.appointment_date;
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      const isDateMatch = appointmentDate === dateString;
      const isTimeOverlap = time >= appointmentStartTime && time < appointmentEndTime;
      
      return isDateMatch && isTimeOverlap;
    });

    return occupied;
  };

  const getAppointmentForSlot = (date: Date, time: string) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    const appointment = appointments.find(appointment => {
      const appointmentDate = appointment.appointment_date;
      const appointmentStartTime = appointment.start_time.substring(0, 5);
      const appointmentEndTime = appointment.end_time.substring(0, 5);
      
      const isDateMatch = appointmentDate === dateString;
      const isTimeInRange = time >= appointmentStartTime && time < appointmentEndTime;
      
      return isDateMatch && isTimeInRange;
    });

    return appointment;
  };

  const isFirstSlotOfAppointment = (date: Date, time: string, appointment: Appointment) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const appointmentStartTime = appointment.start_time.substring(0, 5);
    
    return appointment.appointment_date === dateString && time === appointmentStartTime;
  };

  const calculateAppointmentHeight = (appointment: Appointment) => {
    const startTime = appointment.start_time.substring(0, 5);
    const endTime = appointment.end_time.substring(0, 5);
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;
    
    // Cada slot tem 80px de altura (min-h-[80px])
    // Cada hora = 80px, então cada minuto = 80/60 = 1.33px
    const heightPixels = (durationMinutes / 60) * 80;
    
    return `${heightPixels}px`;
  };

  const canEditAppointment = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.appointment_date + 'T' + appointment.start_time);
    return !isPastTimeSlot(appointmentDate, appointment.start_time.substring(0, 5));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  console.log('=== RENDERIZANDO GRID ===');
  console.log('Total de agendamentos:', appointments.length);
  appointments.forEach(app => {
    console.log(`Renderizando: ${app.client_name} - ${app.service_name} em ${app.appointment_date} das ${app.start_time} às ${app.end_time}`);
  });

  return (
    <div className="overflow-x-auto bg-white">
      <div className="min-w-full">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-6 border-b border-gray-200">
          <div className="p-4 bg-gray-50 border-r border-gray-200"></div>
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-4 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <div className="flex flex-col items-center">
                <div className="text-sm font-semibold text-blue-600 mb-1">
                  {format(day, 'dd', { locale: ptBR })}
                </div>
                <div className="text-xs text-gray-600 uppercase">
                  {format(day, 'EEEE', { locale: ptBR })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horários */}
        <div className="divide-y divide-gray-200">
          {workingHours.map((time) => (
            <div key={time} className="grid grid-cols-6 min-h-[80px] relative">
              {/* Coluna de horário */}
              <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-r border-gray-200 flex items-start justify-center pt-2">
                {time}
              </div>
              
              {/* Colunas dos dias */}
              {weekDays.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const isOccupied = isSlotOccupied(day, time);
                const isPast = isPastTimeSlot(day, time);
                const appointment = getAppointmentForSlot(day, time);
                const isFirstSlot = appointment ? isFirstSlotOfAppointment(day, time, appointment) : false;

                return (
                  <div
                    key={`${dateString}-${time}`}
                    className="relative border-r border-gray-200 last:border-r-0 min-h-[80px] hover:bg-gray-50 cursor-pointer"
                    onClick={() => !isOccupied && !isPast && onSlotClick(dateString, time)}
                  >
                    {appointment && isFirstSlot ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div 
                            className="absolute inset-1 bg-blue-100 border border-blue-300 rounded p-2 shadow-sm cursor-pointer z-10 group"
                            style={{ 
                              height: calculateAppointmentHeight(appointment),
                              minHeight: '76px'
                            }}
                          >
                            <div className="text-xs font-semibold text-blue-800 mb-1 truncate">
                              {appointment.client_name}
                            </div>
                            <div className="text-xs text-blue-600 truncate">
                              {appointment.service_name}
                            </div>
                            <div className="text-xs text-blue-500 mt-1">
                              {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                            </div>
                            
                            {/* Botão de edição */}
                            {canEditAppointment(appointment) && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-blue-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAppointment(appointment);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Detalhes do Agendamento</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Cliente:</strong> {appointment.client_name}</p>
                              <p><strong>Serviço:</strong> {appointment.service_name}</p>
                              <p><strong>Data:</strong> {format(new Date(appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                              <p><strong>Horário:</strong> {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</p>
                              <p><strong>Duração:</strong> {appointment.total_duration} minutos</p>
                              <p><strong>Valor:</strong> R$ {appointment.total_value.toFixed(2)}</p>
                              <p><strong>Status:</strong> {appointment.status || 'Agendado'}</p>
                              {appointment.notes && (
                                <p><strong>Observações:</strong> {appointment.notes}</p>
                              )}
                            </div>
                            {canEditAppointment(appointment) && (
                              <div className="pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEditAppointment(appointment)}
                                  className="w-full"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar Agendamento
                                </Button>
                              </div>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : appointment && !isFirstSlot ? (
                      // Para slots que não são o primeiro, apenas mostrar que está ocupado
                      <div className="absolute inset-0 bg-blue-50 opacity-30"></div>
                    ) : (
                      <>
                        {isPast && (
                          <div className="absolute inset-0 bg-gray-100 opacity-50"></div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduleGrid;

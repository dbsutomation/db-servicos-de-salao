
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import MobileScheduleGrid from './MobileScheduleGrid';
import AppointmentFormDialog from './AppointmentFormDialog';
import EditAppointmentDialog from './EditAppointmentDialog';
import ProfessionalSelector from './ProfessionalSelector';
import WeekNavigation from './WeekNavigation';
import { useSchedulingCalendar } from '@/hooks/useSchedulingCalendar';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Appointment } from '@/types';

const SchedulingCalendar = () => {
  const {
    professionals,
    selectedProfessional,
    setSelectedProfessional,
    currentWeek,
    setCurrentWeek,
    selectedDate,
    setSelectedDate,
    appointments,
    isAppointmentFormOpen,
    selectedSlot,
    loading,
    selectedProfessionalData,
    handleSlotClick,
    handleAppointmentCreated,
    closeAppointmentForm
  } = useSchedulingCalendar();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setIsEditDialogOpen(true);
  };

  const handleAppointmentUpdated = () => {
    handleAppointmentCreated(); // Reutiliza a função para recarregar os dados
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  return (
    <div className="space-y-6">
      <ProfessionalSelector
        professionals={professionals}
        selectedProfessional={selectedProfessional}
        onProfessionalChange={setSelectedProfessional}
      />

      {selectedProfessional && (
        <Card className="shadow-lg border-gray-200">
          {!isMobile && (
            <WeekNavigation
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              professionalName={selectedProfessionalData?.name}
            />
          )}
          
          {isMobile && (
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Agenda de {selectedProfessionalData?.name}
              </h2>
            </div>
          )}

          <div className="overflow-hidden">
            {isMobile ? (
              <MobileScheduleGrid
                currentWeek={currentWeek}
                appointments={appointments}
                onSlotClick={handleSlotClick}
                loading={loading}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            ) : (
              <WeeklyScheduleGrid
                currentWeek={currentWeek}
                appointments={appointments}
                onSlotClick={handleSlotClick}
                onEditAppointment={handleEditAppointment}
                loading={loading}
              />
            )}
          </div>
        </Card>
      )}

      <AppointmentFormDialog
        isOpen={isAppointmentFormOpen}
        onClose={closeAppointmentForm}
        selectedSlot={selectedSlot}
        selectedProfessional={selectedProfessionalData}
        onAppointmentCreated={handleAppointmentCreated}
      />

      <EditAppointmentDialog
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
        appointment={appointmentToEdit}
        onAppointmentUpdated={handleAppointmentUpdated}
      />
    </div>
  );
};

export default SchedulingCalendar;

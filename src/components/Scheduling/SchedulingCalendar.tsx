
import React from 'react';
import { Card } from '@/components/ui/card';
import WeeklyScheduleGrid from './WeeklyScheduleGrid';
import MobileScheduleGrid from './MobileScheduleGrid';
import AppointmentFormDialog from './AppointmentFormDialog';
import ProfessionalSelector from './ProfessionalSelector';
import WeekNavigation from './WeekNavigation';
import { useSchedulingCalendar } from '@/hooks/useSchedulingCalendar';
import { useMediaQuery } from '@/hooks/use-mobile';

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

  const isMobile = useMediaQuery('(max-width: 768px)');

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
    </div>
  );
};

export default SchedulingCalendar;

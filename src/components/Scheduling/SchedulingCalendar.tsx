
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
        <Card>
          <CardHeader>
            {!isMobile && (
              <WeekNavigation
                currentWeek={currentWeek}
                onWeekChange={setCurrentWeek}
                professionalName={selectedProfessionalData?.name}
              />
            )}
            {isMobile && (
              <h2 className="text-lg font-semibold">
                Agenda de {selectedProfessionalData?.name}
              </h2>
            )}
          </CardHeader>
          <CardContent>
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
          </CardContent>
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


import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import SchedulingCalendar from '@/components/Scheduling/SchedulingCalendar';

const Scheduling = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Agenda dos Profissionais</h1>
        </div>
        <SchedulingCalendar />
      </div>
    </MainLayout>
  );
};

export default Scheduling;

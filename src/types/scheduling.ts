
export interface ProfessionalSchedule {
  id: string;
  professional_id: string;
  day_of_week: number; // 0=domingo, 6=sábado
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  professional_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  total_value: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface AppointmentWithDetails extends Appointment {
  client: {
    id: string;
    name: string;
    email: string;
  };
  professional: {
    id: string;
    name: string;
    profession?: string;
  };
  services: (AppointmentService & {
    service: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
  })[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: Appointment;
}

export interface WeekDay {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

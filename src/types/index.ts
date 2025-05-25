
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  category?: string;
  type?: string;
  image?: string;
  commission: number;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  profession: string;
  phone: string;
  email: string;
  password: string;
  hasAccess: boolean;
  isManager: boolean;
  avatar?: string;
  categories?: string[]; // Adicionando as categorias ao tipo TeamMember
}

export interface ServiceRecord {
  id: string;
  serviceId: string;
  clientId: string;
  professionalId: string;
  serviceValue: number;
  commissionAmount: number;
  tipAmount?: number;
  paymentMethod?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  service?: Service;
  client?: Client;
  professional?: TeamMember;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  client_id: string;
  professional_id: string;
  total_duration: number;
  total_value: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

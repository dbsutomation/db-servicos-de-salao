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
  created_at?: string; // Compatibilidade com banco de dados
  updated_at?: string; // Compatibilidade com banco de dados
  createdAt?: string;  // Compatibilidade com código existente
  updatedAt?: string;  // Compatibilidade com código existente
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
  categories?: string[]; // Categorias do profissional
  salonId?: string;   // Salão ao qual o usuário pertence
  salonName?: string; // Nome do salão
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
  // Joined data from related tables
  client_name?: string;
  service_name?: string;
}

// Interfaces que foram removidas por engano
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isManager: boolean;
  accessibleRoutes: string[];
}

export interface Expense {
  id: string;
  name: string;
  description: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
  expense_date: string;
  is_fixed: boolean;
}

export interface CartItem {
  id: string;
  service: Service;
  client: Client;
  teamMember?: TeamMember;
  quantity: number;
  tipAmount?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isManager: boolean;
  accessibleRoutes: string[];
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  commission: number;
  category?: string;
  type?: 'servico' | 'produto';
  duration?: number;
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
  avatar: string;
  userType?: 'professional' | 'client';
}

export interface ServiceRecord {
  id: string;
  service: Service;
  client: Client;
  teamMember: TeamMember;
  date: string;
  commissionAmount?: number;
  paymentMethod?: string;
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

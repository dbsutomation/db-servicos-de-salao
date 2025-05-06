
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  isManager: boolean;
  accessibleRoutes: string[];
}

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  image: string;
  commission: number;
  category?: string;
  type?: 'servico' | 'produto';
}

export interface TeamMember {
  id: number;
  name: string;
  profession: string;
  phone: string;
  email: string;
  password: string;
  hasAccess: boolean;
  isManager: boolean;
  avatar: string;
}

export interface ServiceRecord {
  id: number;
  service: Service;
  client: Client;
  teamMember: TeamMember;
  date: string;
  commissionAmount?: number;
  paymentMethod?: string;
}

export interface Expense {
  id: number;
  name: string;
  description: string;
  amount: number;
}

export interface CartItem {
  id: number;
  service: Service;
  client: Client;
  teamMember?: TeamMember;
}

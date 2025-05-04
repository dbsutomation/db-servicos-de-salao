
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  commission: number; // Percentage of commission for the service
}

export interface TeamMember {
  id: number;
  name: string;
  profession: string;
  phone?: string;
  email?: string;
  isManager?: boolean;
  password?: string; // Added field for password
  hasLoginAccess?: boolean; // Added field for login permission
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export interface ServiceRecord {
  id: number;
  service: Service;
  teamMember: TeamMember;
  client: Client;
  date: string;
  commissionAmount?: number;
}

export interface CartItem {
  service: Service;
  quantity: number;
}

// Add a new interface for authentication state
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: TeamMember | null;
}

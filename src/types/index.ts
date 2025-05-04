
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
  phone?: string; // Added field for phone number
  email?: string; // Added field for email
  isManager?: boolean; // Added field to identify managers
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string; // Added field for email
}

export interface ServiceRecord {
  id: number;
  service: Service;
  teamMember: TeamMember;
  client: Client;
  date: string;
  commissionAmount?: number; // Added field for calculated commission amount
}

export interface CartItem {
  service: Service;
  quantity: number;
}

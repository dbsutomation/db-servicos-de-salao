
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  commission: number; // Added field for commission percentage
}

export interface TeamMember {
  id: number;
  name: string;
  profession: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
}

export interface ServiceRecord {
  id: number;
  service: Service;
  teamMember: TeamMember;
  client: Client;
  date: string;
}

export interface CartItem {
  service: Service;
  quantity: number;
}

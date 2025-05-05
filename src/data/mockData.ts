
import { Service, TeamMember, Client, ServiceRecord } from '../types';

export const services: Service[] = [
  {
    id: 1,
    name: 'Corte de Cabelo',
    description: 'Corte profissional com finalização',
    price: 100.00,
    image: '/placeholder.svg',
    commission: 0
  },
  {
    id: 2,
    name: 'Coloração',
    description: 'Coloração completa com produtos de qualidade',
    price: 200.00,
    image: '/placeholder.svg',
    commission: 0
  },
  {
    id: 3,
    name: 'Manicure',
    description: 'Cuidados completos para suas unhas',
    price: 60.00,
    image: '/placeholder.svg',
    commission: 60
  },
  {
    id: 4,
    name: 'Pedicure',
    description: 'Tratamento para pés com esfoliação e hidratação',
    price: 60.00,
    image: '/placeholder.svg',
    commission: 60
  }
];

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Paulo Ubratan',
    profession: 'Cabelereiro',
    phone: '(11) 98765-4321',
    email: 'paulo.ubiratan@salao.com',
    password: '@123456',
    isManager: true,
    hasLoginAccess: true
  },
  {
    id: 2,
    name: 'Maria Isabel',
    profession: 'Manicure',
    phone: '(11) 98765-4321',
    email: 'maria.isabel@salao.com',
    password: '@123456',
    isManager: false,
    hasLoginAccess: true
  }
];

export const clients: Client[] = [
  {
    id: 1,
    name: 'Juliana Ferreira',
    phone: '(11) 99999-1111',
    email: 'juliana.ferreira@exemplo.com'
  },
  {
    id: 2,
    name: 'Roberto Almeida',
    phone: '(11) 99999-2222',
    email: 'roberto.almeida@exemplo.com'
  },
  {
    id: 3,
    name: 'Camila Costa',
    phone: '(11) 99999-3333',
    email: 'camila.costa@exemplo.com'
  },
];

// Helper function to create a date in 2025, May
const createDateInMay2025 = (day: number) => {
  return `2025-05-${String(day).padStart(2, '0')}`;
}

// Calculate commission amount for each service record
export const serviceRecords: ServiceRecord[] = [
  // Manicure e Pedicure by Maria (6 records)
  {
    id: 1,
    service: services[2], // Manicure
    teamMember: teamMembers[1], // Maria
    client: clients[0], // Juliana
    date: createDateInMay2025(5),
    commissionAmount: services[2].price * (services[2].commission / 100)
  },
  {
    id: 2,
    service: services[3], // Pedicure
    teamMember: teamMembers[1], // Maria
    client: clients[1], // Roberto
    date: createDateInMay2025(7),
    commissionAmount: services[3].price * (services[3].commission / 100)
  },
  {
    id: 3,
    service: services[2], // Manicure
    teamMember: teamMembers[1], // Maria
    client: clients[2], // Camila
    date: createDateInMay2025(10),
    commissionAmount: services[2].price * (services[2].commission / 100)
  },
  {
    id: 4,
    service: services[3], // Pedicure
    teamMember: teamMembers[1], // Maria
    client: clients[0], // Juliana
    date: createDateInMay2025(12),
    commissionAmount: services[3].price * (services[3].commission / 100)
  },
  {
    id: 5,
    service: services[2], // Manicure
    teamMember: teamMembers[1], // Maria
    client: clients[1], // Roberto
    date: createDateInMay2025(15),
    commissionAmount: services[2].price * (services[2].commission / 100)
  },
  {
    id: 6,
    service: services[2], // Manicure
    teamMember: teamMembers[1], // Maria
    client: clients[2], // Camila
    date: createDateInMay2025(17),
    commissionAmount: services[2].price * (services[2].commission / 100)
  },
  
  // Corte e Coloração by Paulo (4 records)
  {
    id: 7,
    service: services[0], // Corte
    teamMember: teamMembers[0], // Paulo
    client: clients[0], // Juliana
    date: createDateInMay2025(6),
    commissionAmount: services[0].price * (services[0].commission / 100)
  },
  {
    id: 8,
    service: services[1], // Coloração
    teamMember: teamMembers[0], // Paulo
    client: clients[2], // Camila
    date: createDateInMay2025(9),
    commissionAmount: services[1].price * (services[1].commission / 100)
  },
  {
    id: 9,
    service: services[0], // Corte
    teamMember: teamMembers[0], // Paulo
    client: clients[1], // Roberto
    date: createDateInMay2025(18),
    commissionAmount: services[0].price * (services[0].commission / 100)
  },
  {
    id: 10,
    service: services[1], // Coloração
    teamMember: teamMembers[0], // Paulo
    client: clients[0], // Juliana
    date: createDateInMay2025(20),
    commissionAmount: services[1].price * (services[1].commission / 100)
  }
];

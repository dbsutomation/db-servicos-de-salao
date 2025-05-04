
import { Service, TeamMember, Client, ServiceRecord } from '../types';

export const services: Service[] = [
  {
    id: 1,
    name: 'Corte de Cabelo',
    description: 'Corte profissional com finalização',
    price: 80.00,
    image: '/placeholder.svg',
    commission: 100
  },
  {
    id: 2,
    name: 'Coloração',
    description: 'Coloração completa com produtos de qualidade',
    price: 150.00,
    image: '/placeholder.svg',
    commission: 100
  },
  {
    id: 3,
    name: 'Manicure',
    description: 'Cuidados completos para suas unhas',
    price: 50.00,
    image: '/placeholder.svg',
    commission: 100
  },
  {
    id: 4,
    name: 'Pedicure',
    description: 'Tratamento para pés com esfoliação e hidratação',
    price: 60.00,
    image: '/placeholder.svg',
    commission: 100
  },
  {
    id: 5,
    name: 'Hidratação Capilar',
    description: 'Tratamento intensivo para cabelos danificados',
    price: 90.00,
    image: '/placeholder.svg',
    commission: 100
  },
  {
    id: 6,
    name: 'Maquiagem',
    description: 'Maquiagem profissional para eventos',
    price: 120.00,
    image: '/placeholder.svg',
    commission: 100
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Ana Silva',
    profession: 'Cabeleireira',
    phone: '(11) 98765-4321',
    email: 'ana.silva@exemplo.com',
    isManager: true
  },
  {
    id: 2,
    name: 'Carlos Santos',
    profession: 'Colorista',
    phone: '(11) 91234-5678',
    email: 'carlos.santos@exemplo.com',
    isManager: false
  },
  {
    id: 3,
    name: 'Mariana Lima',
    profession: 'Manicure',
    phone: '(11) 99876-5432',
    email: 'mariana.lima@exemplo.com',
    isManager: false
  },
  {
    id: 4,
    name: 'Paulo Oliveira',
    profession: 'Maquiador',
    phone: '(11) 94321-8765',
    email: 'paulo.oliveira@exemplo.com',
    isManager: false
  },
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

// Calculate commission amount for each service record
export const serviceRecords: ServiceRecord[] = [
  {
    id: 1,
    service: services[0],
    teamMember: teamMembers[0],
    client: clients[0],
    date: '2023-05-01',
    commissionAmount: services[0].price * (services[0].commission / 100)
  },
  {
    id: 2,
    service: services[1],
    teamMember: teamMembers[1],
    client: clients[1],
    date: '2023-05-02',
    commissionAmount: services[1].price * (services[1].commission / 100)
  },
  {
    id: 3,
    service: services[2],
    teamMember: teamMembers[2],
    client: clients[2],
    date: '2023-05-03',
    commissionAmount: services[2].price * (services[2].commission / 100)
  },
  {
    id: 4,
    service: services[0],
    teamMember: teamMembers[0],
    client: clients[0],
    date: '2023-05-10',
    commissionAmount: services[0].price * (services[0].commission / 100)
  },
  {
    id: 5,
    service: services[3],
    teamMember: teamMembers[1],
    client: clients[1],
    date: '2023-05-15',
    commissionAmount: services[3].price * (services[3].commission / 100)
  },
  {
    id: 6,
    service: services[4],
    teamMember: teamMembers[2],
    client: clients[2],
    date: '2023-05-20',
    commissionAmount: services[4].price * (services[4].commission / 100)
  },
  {
    id: 7,
    service: services[5],
    teamMember: teamMembers[3],
    client: clients[0],
    date: '2023-05-25',
    commissionAmount: services[5].price * (services[5].commission / 100)
  },
];

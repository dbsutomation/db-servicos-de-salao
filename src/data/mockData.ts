
import { Service, TeamMember, Client, ServiceRecord } from '../types';

export const services: Service[] = [
  {
    id: 1,
    name: 'Corte de Cabelo',
    description: 'Corte profissional com finalização',
    price: 80.00,
    image: '/placeholder.svg'
  },
  {
    id: 2,
    name: 'Coloração',
    description: 'Coloração completa com produtos de qualidade',
    price: 150.00,
    image: '/placeholder.svg'
  },
  {
    id: 3,
    name: 'Manicure',
    description: 'Cuidados completos para suas unhas',
    price: 50.00,
    image: '/placeholder.svg'
  },
  {
    id: 4,
    name: 'Pedicure',
    description: 'Tratamento para pés com esfoliação e hidratação',
    price: 60.00,
    image: '/placeholder.svg'
  },
  {
    id: 5,
    name: 'Hidratação Capilar',
    description: 'Tratamento intensivo para cabelos danificados',
    price: 90.00,
    image: '/placeholder.svg'
  },
  {
    id: 6,
    name: 'Maquiagem',
    description: 'Maquiagem profissional para eventos',
    price: 120.00,
    image: '/placeholder.svg'
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Ana Silva',
    profession: 'Cabeleireira'
  },
  {
    id: 2,
    name: 'Carlos Santos',
    profession: 'Colorista'
  },
  {
    id: 3,
    name: 'Mariana Lima',
    profession: 'Manicure'
  },
  {
    id: 4,
    name: 'Paulo Oliveira',
    profession: 'Maquiador'
  },
];

export const clients: Client[] = [
  {
    id: 1,
    name: 'Juliana Ferreira',
    phone: '(11) 99999-1111'
  },
  {
    id: 2,
    name: 'Roberto Almeida',
    phone: '(11) 99999-2222'
  },
  {
    id: 3,
    name: 'Camila Costa',
    phone: '(11) 99999-3333'
  },
];

export const serviceRecords: ServiceRecord[] = [
  {
    id: 1,
    service: services[0],
    teamMember: teamMembers[0],
    client: clients[0],
    date: '2023-05-01'
  },
  {
    id: 2,
    service: services[1],
    teamMember: teamMembers[1],
    client: clients[1],
    date: '2023-05-02'
  },
  {
    id: 3,
    service: services[2],
    teamMember: teamMembers[2],
    client: clients[2],
    date: '2023-05-03'
  },
];

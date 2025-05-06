
import { Client, Service, ServiceRecord, TeamMember } from '@/types';

// Updated team members data
export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Paulo Ubratan',
    profession: 'Cabelereiro',
    phone: '(11) 98765-4321',
    email: 'paulo.ubiratan@salao.com',
    password: '@123456',
    hasAccess: true,
    isManager: true,
    avatar: '/placeholder.svg'
  },
  {
    id: 2,
    name: 'Maria Isabel',
    profession: 'Manicure',
    phone: '(11) 98765-4321',
    email: 'maria.isabel@salao.com',
    password: '@123456',
    hasAccess: true,
    isManager: false,
    avatar: '/placeholder.svg'
  }
];

// Updated services data with new structure
export const services: Service[] = [
  {
    id: 1,
    name: 'Corte de Cabelo',
    description: 'Corte masculino ou feminino',
    price: 100,
    commission: 0,
    image: '/placeholder.svg',
    category: 'cabelo',
    type: 'servico'
  },
  {
    id: 2,
    name: 'Coloração',
    description: 'Aplicação de cor e tintura',
    price: 200,
    commission: 0,
    image: '/placeholder.svg',
    category: 'cabelo',
    type: 'servico'
  },
  {
    id: 4,
    name: 'Manicure',
    description: 'Tratamento das unhas das mãos',
    price: 60,
    commission: 60,
    image: '/placeholder.svg',
    category: 'unhas',
    type: 'servico'
  },
  {
    id: 5,
    name: 'Pedicure',
    description: 'Tratamento das unhas dos pés',
    price: 60,
    commission: 60,
    image: '/placeholder.svg',
    category: 'unhas',
    type: 'servico'
  }
];

// Client data
export const clients: Client[] = [
  {
    id: 1,
    name: 'João Silva',
    phone: '(11) 99999-8888',
    email: 'joao.silva@email.com'
  },
  {
    id: 2,
    name: 'Maria Oliveira',
    phone: '(11) 97777-6666',
    email: 'maria.oliveira@email.com'
  },
  {
    id: 3,
    name: 'Pedro Santos',
    phone: '(11) 95555-4444',
    email: 'pedro.santos@email.com'
  }
];

// Create 10 new service records (6 for manicure/pedicure for Maria, 4 for haircut/coloring for Paulo)
export const serviceRecords: ServiceRecord[] = [
  // Maria's services (Manicure/Pedicure)
  {
    id: 1,
    service: services.find(s => s.name === 'Manicure')!,
    client: clients[0],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-01',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'Dinheiro'
  },
  {
    id: 2,
    service: services.find(s => s.name === 'Pedicure')!,
    client: clients[1],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-02',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'Crédito'
  },
  {
    id: 3,
    service: services.find(s => s.name === 'Manicure')!,
    client: clients[2],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-03',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'Débito'
  },
  {
    id: 4,
    service: services.find(s => s.name === 'Pedicure')!,
    client: clients[0],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-04',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'PIX'
  },
  {
    id: 5,
    service: services.find(s => s.name === 'Manicure')!,
    client: clients[1],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-05',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'Dinheiro'
  },
  {
    id: 6,
    service: services.find(s => s.name === 'Pedicure')!,
    client: clients[2],
    teamMember: teamMembers.find(m => m.name === 'Maria Isabel')!,
    date: '2025-05-06',
    commissionAmount: 36, // 60% of 60
    paymentMethod: 'Crédito'
  },
  
  // Paulo's services (Haircut/Coloring)
  {
    id: 7,
    service: services.find(s => s.name === 'Corte de Cabelo')!,
    client: clients[0],
    teamMember: teamMembers.find(m => m.name === 'Paulo Ubratan')!,
    date: '2025-05-03',
    commissionAmount: 0, // 0% commission
    paymentMethod: 'PIX'
  },
  {
    id: 8,
    service: services.find(s => s.name === 'Coloração')!,
    client: clients[1],
    teamMember: teamMembers.find(m => m.name === 'Paulo Ubratan')!,
    date: '2025-05-04',
    commissionAmount: 0, // 0% commission
    paymentMethod: 'Débito'
  },
  {
    id: 9,
    service: services.find(s => s.name === 'Corte de Cabelo')!,
    client: clients[2],
    teamMember: teamMembers.find(m => m.name === 'Paulo Ubratan')!,
    date: '2025-05-05',
    commissionAmount: 0, // 0% commission
    paymentMethod: 'Dinheiro'
  },
  {
    id: 10,
    service: services.find(s => s.name === 'Coloração')!,
    client: clients[0],
    teamMember: teamMembers.find(m => m.name === 'Paulo Ubratan')!,
    date: '2025-05-06',
    commissionAmount: 0, // 0% commission
    paymentMethod: 'Crédito'
  }
];

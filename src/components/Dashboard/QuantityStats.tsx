import React from 'react';
import { Scissors, Star, Users } from 'lucide-react';
import StatCard from './StatCard';

interface TopItem { name: string; count: number; }
interface QuantityStatsProps {
  totalServices: number;
  totalClients: number;
  topServices: TopItem;
  topClient: TopItem;
}

const QuantityStats: React.FC<QuantityStatsProps> = ({ totalServices, totalClients, topServices, topClient }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Indicadores de Quantidade</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total de Serviços" value={totalServices} icon={<Scissors size={20} />} />
      <StatCard label="Clientes Atendidos" value={totalClients} icon={<Users size={20} />} />
      <StatCard label="Serviço Mais Realizado" value={`${topServices.name} (${topServices.count})`} icon={<Star size={20} />} />
      <StatCard label="Cliente com Mais Serviços" value={`${topClient.name} (${topClient.count})`} icon={<Star size={20} />} />
    </div>
  </section>
);

export default QuantityStats;

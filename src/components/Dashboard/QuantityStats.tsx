import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TopItem {
  name: string;
  count: number;
}

interface QuantityStatsProps {
  totalServices: number;
  totalClients: number;
  topServices: TopItem;
  topClient: TopItem;
}

const QuantityStats: React.FC<QuantityStatsProps> = ({ 
  totalServices, 
  totalClients, 
  topServices, 
  topClient 
}) => {
  return (
    <>
      <h2 className="text-xl font-semibold">Indicadores de Quantidade</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader>
            <CardDescription>Total de Serviços</CardDescription>
            <CardTitle className="text-3xl">{totalServices}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader>
            <CardDescription>Clientes Atendidos</CardDescription>
            <CardTitle className="text-3xl">{totalClients}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader>
            <CardDescription>Serviço Mais Realizado</CardDescription>
            <CardTitle className="text-2xl">
              {topServices.name} ({topServices.count})
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader>
            <CardDescription>Cliente com Mais Serviços</CardDescription>
            <CardTitle className="text-2xl">
              {topClient.name} ({topClient.count})
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </>
  );
};

export default QuantityStats;

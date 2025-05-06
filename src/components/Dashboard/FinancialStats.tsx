
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialStatsProps {
  totalRevenue: number;
  totalCommissions: number;
  totalExpenses: number;
  netProfit: number;
}

const FinancialStats: React.FC<FinancialStatsProps> = ({ 
  totalRevenue, 
  totalCommissions, 
  totalExpenses, 
  netProfit 
}) => {
  const { currentUser } = useAuth();
  const isManager = currentUser?.isManager;

  return (
    <>
      <h2 className="text-xl font-semibold">Indicadores Financeiros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader className="bg-[#F2FCE2]">
            <CardDescription>Faturamento Total</CardDescription>
            <CardTitle className="text-3xl">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency', 
                currency: 'BRL'
              }).format(totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="shadow-md border-2 border-gray-100">
          <CardHeader className="bg-[#ea384c]/20">
            <CardDescription>Comissão Total</CardDescription>
            <CardTitle className="text-3xl">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency', 
                currency: 'BRL'
              }).format(totalCommissions)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        {isManager && (
          <Card className="shadow-md border-2 border-gray-100">
            <CardHeader className="bg-[#ea384c]/20">
              <CardDescription>Despesas</CardDescription>
              <CardTitle className="text-3xl">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency', 
                  currency: 'BRL'
                }).format(totalExpenses)}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
        
        {isManager && (
          <Card className="shadow-md border-2 border-gray-100">
            <CardHeader className="bg-[#F2FCE2]">
              <CardDescription>Lucro Líquido</CardDescription>
              <CardTitle className="text-3xl">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency', 
                  currency: 'BRL'
                }).format(netProfit)}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
};

export default FinancialStats;

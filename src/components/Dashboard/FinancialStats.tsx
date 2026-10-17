import React from 'react';
import { BarChart3, Coins, Receipt, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from './StatCard';

interface FinancialStatsProps {
  totalRevenue: number;
  totalCommissions: number;
  totalExpenses: number;
  netProfit: number;
}

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const FinancialStats: React.FC<FinancialStatsProps> = ({ totalRevenue, totalCommissions, totalExpenses, netProfit }) => {
  const { currentUser } = useAuth();
  const showExpenses = currentUser?.isManager && currentUser?.features?.expenses;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${showExpenses ? 'lg:grid-cols-4' : ''} gap-4`}>
      <StatCard size="lg" tone="primary" label="Faturamento Total" value={brl(totalRevenue)} icon={<BarChart3 size={22} />} />
      <StatCard size="lg" tone="destructive" label="Comissão Total" value={brl(totalCommissions)} icon={<Coins size={22} />} />
      {showExpenses && (
        <StatCard size="lg" tone="destructive" label="Despesas" value={brl(totalExpenses)} icon={<Receipt size={22} />} />
      )}
      {showExpenses && (
        <StatCard size="lg" tone={netProfit >= 0 ? 'primary' : 'destructive'} label="Lucro Líquido" value={brl(netProfit)} icon={<TrendingUp size={22} />} />
      )}
    </div>
  );
};

export default FinancialStats;

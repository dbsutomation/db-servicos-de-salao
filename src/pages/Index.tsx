
import React, { useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Componentes do dashboard
import { QuantityStats } from '@/components/Dashboard/QuantityStats';
import { FinancialStats } from '@/components/Dashboard/FinancialStats';
import { ServiceRecordsTable } from '@/components/Dashboard/ServiceRecordsTable';
import { PaymentMethodStats } from '@/components/Dashboard/PaymentMethodStats';
import { DashboardFilters } from '@/components/Dashboard/DashboardFilters';

// Hook de dados do dashboard
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { dateRange, paymentMethod, onChangeFilters } = useDashboardData();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[Index] Usuário não autenticado, redirecionando para /login");
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Se estiver carregando, exibir indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-t-salon-purple border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderiza nada (redirecionamento será feito pelo useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Acompanhe os principais indicadores do seu salão</p>
          </div>

          <DashboardFilters
            dateRange={dateRange}
            paymentMethod={paymentMethod}
            onChangeFilters={onChangeFilters}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <QuantityStats />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FinancialStats />
          </div>
          <div>
            <PaymentMethodStats />
          </div>
        </div>

        <div>
          <ServiceRecordsTable />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

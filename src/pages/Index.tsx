
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import FinancialStats from '@/components/Dashboard/FinancialStats';
import PaymentMethodStats from '@/components/Dashboard/PaymentMethodStats';
import QuantityStats from '@/components/Dashboard/QuantityStats';
import ServiceRecordsTable from '@/components/Dashboard/ServiceRecordsTable';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [showFinancialData, setShowFinancialData] = useState(true);
  const { currentUser } = useAuth();

  const {
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedProfessional,
    setSelectedProfessional,
    selectedType,
    setSelectedType,
    clientSearchTerm,
    setClientSearchTerm,
    totalExpenses,
    totalServices,
    totalCommissions,
    totalRevenue,
    netProfit,
    totalClients,
    totalTips,
    topServices,
    topClient,
    paymentMethodStats,
    serviceRecordsList,
    loading,
    loadError,
    hasAnyRecords
  } = useDashboardData();

  const toggleFinancialData = () => {
    setShowFinancialData(!showFinancialData);
  };

  return (
    <MainLayout>
      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleFinancialData}
              title={showFinancialData ? "Esconder dados financeiros" : "Mostrar dados financeiros"}
            >
              {showFinancialData ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <div className="w-full overflow-x-auto">
            <DashboardFilters 
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              selectedProfessional={selectedProfessional}
              setSelectedProfessional={setSelectedProfessional}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando dados...</p>
          </div>
        ) : (
          <>
            {loadError ? <p role="alert" className="border-l-4 border-destructive bg-muted p-4 text-sm">Não foi possível carregar os dados. Tente recarregar a página.</p> : !hasAnyRecords && (
              <section className="border-l-4 border-primary bg-accent p-4 space-y-3">
                <h2 className="font-semibold">Bem-vindo à Gestão de Produtos e Serviços</h2>
                <p className="text-sm text-muted-foreground">{currentUser?.isManager ? 'Nenhum registro realizado ainda. Seu estabelecimento está pronto para começar.' : 'Você ainda não possui registros realizados.'}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild><Link to="/services">{currentUser?.isManager ? 'Cadastrar serviços e produtos' : 'Ver serviços e produtos'}</Link></Button>
                  {currentUser?.isManager && <Button asChild variant="outline"><Link to="/team">Cadastrar profissionais</Link></Button>}
                </div>
              </section>
            )}
            {/* Financial Stats Cards - Conditional rendering based on showFinancialData */}
            {showFinancialData && (
              <FinancialStats 
                totalRevenue={totalRevenue}
                totalCommissions={totalCommissions}
                totalExpenses={totalExpenses}
                netProfit={netProfit}
              />
            )}

            {/* Stats by payment method - Conditional rendering based on showFinancialData */}
            {showFinancialData && (
              <PaymentMethodStats paymentMethodStats={paymentMethodStats} />
            )}

            {/* Quantity Stats Cards */}
            <QuantityStats 
              totalServices={totalServices}
              totalClients={totalClients}
              topServices={{
                name: topServices.name,
                count: Number(topServices.count)
              }}
              topClient={{
                name: topClient.name,
                count: Number(topClient.count)
              }}
            />

            {/* Services Records List */}
            <ServiceRecordsTable 
              serviceRecordsList={serviceRecordsList}
              searchTerm={clientSearchTerm}
              setSearchTerm={setClientSearchTerm}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;

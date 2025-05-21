
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

const Index = () => {
  const [showFinancialData, setShowFinancialData] = useState(true);

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
    totalExpenses,
    totalServices,
    totalCommissions,
    totalServiceValue,
    totalRevenue,
    netProfit,
    totalClients,
    totalTips,
    topServices,
    topClient,
    paymentMethodStats,
    serviceRecordsList,
    loading
  } = useDashboardData();

  const toggleFinancialData = () => {
    setShowFinancialData(!showFinancialData);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-4">
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
            {/* Botão para mostrar/esconder dados financeiros */}
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleFinancialData}
              className="ml-2" 
              title={showFinancialData ? "Esconder dados financeiros" : "Mostrar dados financeiros"}
            >
              {showFinancialData ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando dados...</p>
          </div>
        ) : (
          <>
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
              totalCommissions={totalCommissions}
              totalServiceValue={totalServiceValue}
              totalTips={totalTips || 0} // Ensure we pass a number, defaulting to 0 if totalTips is undefined
            />
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;

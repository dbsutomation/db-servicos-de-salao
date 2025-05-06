
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import FinancialStats from '@/components/Dashboard/FinancialStats';
import PaymentMethodStats from '@/components/Dashboard/PaymentMethodStats';
import QuantityStats from '@/components/Dashboard/QuantityStats';
import ServiceRecordsTable from '@/components/Dashboard/ServiceRecordsTable';
import { useDashboardData } from '@/hooks/useDashboardData';

const Index = () => {
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
    topServices,
    topClient,
    paymentMethodStats,
    serviceRecordsList
  } = useDashboardData();

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
            
            <Link to="/services">
              <Button className="bg-salon-purple hover:bg-salon-dark-purple shadow-md">
                Novo Registro
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Stats Cards */}
        <FinancialStats 
          totalRevenue={totalRevenue}
          totalCommissions={totalCommissions}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
        />

        {/* Stats by payment method */}
        <PaymentMethodStats paymentMethodStats={paymentMethodStats} />

        {/* Quantity Stats Cards */}
        <QuantityStats 
          totalServices={totalServices}
          totalClients={totalClients}
          topServices={topServices}
          topClient={topClient}
        />

        {/* Services Records List */}
        <ServiceRecordsTable 
          serviceRecordsList={serviceRecordsList}
          totalCommissions={totalCommissions}
          totalServiceValue={totalServiceValue}
        />
      </div>
    </MainLayout>
  );
};

export default Index;

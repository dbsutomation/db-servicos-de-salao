
import { useState, useEffect, useMemo } from 'react';
import { isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { serviceRecords } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Expense } from '@/types';

// Mock expenses data
const initialExpenses: Expense[] = [
  { id: "1", name: 'Aluguel', description: 'Aluguel mensal do salão', amount: 2500 },
  { id: "2", name: 'Água', description: 'Conta de água', amount: 150 },
  { id: "3", name: 'Luz', description: 'Conta de energia elétrica', amount: 350 },
  { id: "4", name: 'Internet', description: 'Serviço de internet', amount: 120 }
];

export const useDashboardData = () => {
  const { currentUser } = useAuth();
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  // If user is not a manager, pre-filter by their ID
  useEffect(() => {
    if (currentUser && !currentUser.isManager) {
      setSelectedProfessional(currentUser.id);
    }
  }, [currentUser]);

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    let records = [...serviceRecords];
    
    // Filter by professional if selected
    if (selectedProfessional && selectedProfessional !== 'all') {
      records = records.filter(record => record.teamMember.id === selectedProfessional);
    } else if (currentUser && !currentUser.isManager) {
      // Non-managers can only see their own records
      records = records.filter(record => record.teamMember.id === currentUser.id);
    }
    
    // Filter by product/service type
    if (selectedType !== 'all') {
      records = records.filter(record => record.service.type === selectedType);
    }
    
    // Apply date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      records = records.filter(record => record.date === today);
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      records = records.filter(record => 
        new Date(record.date) >= oneWeekAgo
      );
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      records = records.filter(record => 
        new Date(record.date) >= oneMonthAgo
      );
    } else if (dateFilter === 'custom' && startDate && endDate) {
      records = records.filter(record => {
        const recordDate = parseISO(record.date);
        return isAfter(recordDate, startDate) && isBefore(recordDate, addDays(endDate, 1));
      });
    }
    
    return records;
  }, [serviceRecords, dateFilter, startDate, endDate, selectedProfessional, selectedType, currentUser]);
  
  // Calculate expenses
  const totalExpenses = initialExpenses.reduce((total, expense) => total + expense.amount, 0);

  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalCommissions = filteredRecords.reduce((total, record) => total + (record.commissionAmount || 0), 0);
  const totalServiceValue = filteredRecords.reduce((total, record) => total + record.service.price, 0);
  const totalRevenue = totalServiceValue; // Revenue is the total value of all services/products
  const netProfit = totalRevenue - totalCommissions - totalExpenses; // Net profit after deducting commissions and expenses
  const totalClients = new Set(filteredRecords.map(record => record.client.id)).size;
  
  // Calculate most used services
  const topServices = useMemo(() => {
    const serviceCounts = filteredRecords.reduce((acc, record) => {
      const serviceId = record.service.id;
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get the service with most occurrences
    const entries = Object.entries(serviceCounts);
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [serviceId, count] = entries[0];
    const service = filteredRecords.find(r => r.service.id === serviceId)?.service;
    
    return service ? { name: service.name, count } : { name: 'Não disponível', count: 0 };
  }, [filteredRecords]);

  // Calculate top clients
  const topClient = useMemo(() => {
    const clientCounts = filteredRecords.reduce((acc, record) => {
      const clientId = record.client.id;
      acc[clientId] = (acc[clientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get the client with most occurrences
    const entries = Object.entries(clientCounts);
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [clientId, count] = entries[0];
    const client = filteredRecords.find(r => r.client.id === clientId)?.client;
    
    return client ? { name: client.name, count } : { name: 'Não disponível', count: 0 };
  }, [filteredRecords]);
  
  // Calculate payment method stats
  const paymentMethodStats = useMemo(() => {
    const stats = filteredRecords.reduce((acc, record) => {
      const method = record.paymentMethod || 'Não especificado';
      acc[method] = (acc[method] || 0) + record.service.price;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([method, amount]) => ({
      method, 
      amount
    }));
  }, [filteredRecords]);

  // Show individual service records
  const serviceRecordsList = useMemo(() => {
    return filteredRecords.map(record => ({
      id: record.id,
      professional: record.teamMember.name,
      profession: record.teamMember.profession,
      service: record.service.name,
      serviceType: record.service.type || 'servico',
      category: record.service.category || '-',
      client: record.client.name,
      date: record.date,
      paymentMethod: record.paymentMethod || 'Não especificado',
      commissionAmount: record.commissionAmount || 0,
      serviceValue: record.service.price
    }));
  }, [filteredRecords]);

  return {
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
  };
};


import { useState, useEffect, useMemo } from 'react';
import { isAfter, isBefore, addDays, parseISO, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ServiceRecord, Service, TeamMember, Client } from '@/types';

export const useDashboardData = () => {
  // Explicitly set timezone to Brasilia time (UTC-3)
  const timeZone = 'America/Sao_Paulo';
  
  // Get current date in local timezone
  const now = new Date();
  const localNow = toZonedTime(now, timeZone);
  
  // Calculate start (Sunday) and end (Saturday) of the current week
  const startOfCurrentWeek = startOfWeek(localNow, { weekStartsOn: 0 }); // 0 = Sunday
  const endOfCurrentWeek = endOfWeek(localNow, { weekStartsOn: 0 }); // Week ends on Saturday
  
  // Calculate start and end of current month
  const startOfCurrentMonth = startOfMonth(localNow);
  const endOfCurrentMonth = endOfMonth(localNow);
  
  const { currentUser } = useAuth();
  const [dateFilter, setDateFilter] = useState('custom'); // Default to custom range
  const [startDate, setStartDate] = useState<Date | undefined>(startOfCurrentWeek);
  const [endDate, setEndDate] = useState<Date | undefined>(endOfCurrentWeek);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch expenses and service records from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*');

        if (expensesError) {
          throw expensesError;
        }

        // Fetch service records with related data
        const { data: recordsData, error: recordsError } = await supabase
          .from('service_records')
          .select(`
            id,
            date,
            payment_method,
            commission_amount,
            service_value,
            tip_amount,
            services:service_id (id, name, price, type, category),
            clients:client_id (id, name),
            users:professional_id (id, name, profession)
          `);

        if (recordsError) {
          throw recordsError;
        }

        setExpenses(expensesData || []);
        
        // Transform the fetched data to match the expected structure
        // Fix timezone issues by correctly handling dates
        const formattedRecords = recordsData?.map((record: any) => {
          // Handle date with proper timezone conversion
          let recordDate: string;
          
          if (record.date) {
            // Parse the UTC date from the database
            const utcDate = new Date(record.date);
            
            // Convert to the local timezone (America/Sao_Paulo)
            const localDate = toZonedTime(utcDate, timeZone);
            
            // Format as ISO date string (YYYY-MM-DD)
            recordDate = format(localDate, 'yyyy-MM-dd');
          } else {
            // If no date provided, use current date in local timezone
            recordDate = format(localNow, 'yyyy-MM-dd');
          }

          return {
            id: record.id,
            date: recordDate,
            paymentMethod: record.payment_method,
            commissionAmount: Number(record.commission_amount || 0),
            serviceValue: Number(record.service_value || 0),
            tipAmount: Number(record.tip_amount || 0),
            service: record.services,
            client: record.clients,
            teamMember: {
              ...record.users,
              profession: record.users?.profession || 'Não especificado'
            }
          };
        }) || [];

        console.log('Formatted records with timezone adjustment:', formattedRecords.slice(0, 2));
        setServiceRecords(formattedRecords);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      const todayStr = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');
      records = records.filter(record => record.date === todayStr);
    } else if (dateFilter === 'week') {
      // Últimos 7 dias (inclusivo) em horário de Brasília, evitando problemas de timezone
      const endStr = format(localNow, 'yyyy-MM-dd');
      const startStr = format(addDays(localNow, -6), 'yyyy-MM-dd');
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
    } else if (dateFilter === 'month') {
      // Últimos 30 dias (inclusivo)
      const endStr = format(localNow, 'yyyy-MM-dd');
      const oneMonthAgo = new Date(localNow);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const startStr = format(oneMonthAgo, 'yyyy-MM-dd');
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      // Comparação inclusiva por data (YYYY-MM-DD) para evitar exclusão das bordas
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
    }
    
    // Sort records by date (newest first)
    records.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    
    return records;
  }, [serviceRecords, dateFilter, startDate, endDate, selectedProfessional, selectedType, currentUser]);

  // Filter expenses to only show those from the current month for the dashboard
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      if (!expense.expense_date) return false;
      
      try {
        const expenseDate = parseISO(expense.expense_date);
        return isWithinInterval(expenseDate, {
          start: startOfCurrentMonth,
          end: endOfCurrentMonth
        });
      } catch (e) {
        return false;
      }
    });
  }, [expenses, startOfCurrentMonth, endOfCurrentMonth]);
  
  // Calculate expenses using filtered expenses
  const totalExpenses = filteredExpenses.reduce((total, expense) => total + Number(expense.amount), 0);

  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalCommissions = filteredRecords.reduce((total, record) => total + Number(record.commissionAmount || 0), 0);
  const totalServiceValue = filteredRecords.reduce((total, record) => total + Number(record.serviceValue || record.service?.price || 0), 0);
  const totalRevenue = totalServiceValue; // Revenue is the total value of all services/products
  const totalTips = filteredRecords.reduce((total, record) => total + Number(record.tipAmount || 0), 0);
  const netProfit = totalRevenue - totalCommissions - totalExpenses; // Net profit after deducting commissions and expenses
  const totalClients = new Set(filteredRecords.map(record => record.client?.id)).size;
  
  // Calculate most used services
  const topServices = useMemo(() => {
    const serviceCounts: Record<string, number> = filteredRecords.reduce((acc: Record<string, number>, record) => {
      if (record.service?.id) {
        const serviceId = record.service.id;
        acc[serviceId] = (acc[serviceId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get the service with most occurrences
    const entries = Object.entries(serviceCounts);
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [serviceId, count] = entries[0];
    const service = filteredRecords.find(r => r.service?.id === serviceId)?.service;
    
    return service ? { name: service.name || 'Não disponível', count } : { name: 'Não disponível', count: 0 };
  }, [filteredRecords]);

  // Calculate top clients
  const topClient = useMemo(() => {
    const clientCounts: Record<string, number> = filteredRecords.reduce((acc: Record<string, number>, record) => {
      if (record.client?.id) {
        const clientId = record.client.id;
        acc[clientId] = (acc[clientId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get the client with most occurrences
    const entries = Object.entries(clientCounts);
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [clientId, count] = entries[0];
    const client = filteredRecords.find(r => r.client?.id === clientId)?.client;
    
    return client ? { name: client.name || 'Não disponível', count } : { name: 'Não disponível', count: 0 };
  }, [filteredRecords]);
  
  // Calculate payment method stats
  const paymentMethodStats = useMemo(() => {
    const stats = filteredRecords.reduce((acc: Record<string, number>, record) => {
      const method = record.paymentMethod || 'Não especificado';
      acc[method] = (acc[method] || 0) + Number(record.serviceValue || record.service?.price || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([method, amount]) => ({
      method, 
      amount: Number(amount)
    }));
  }, [filteredRecords]);

  // Format records for the table display
  const serviceRecordsList = useMemo(() => {
    return filteredRecords.map(record => ({
      id: record.id,
      professional: record.teamMember?.name || 'Não especificado',
      profession: record.teamMember?.profession || 'Não especificado',
      service: record.service?.name || 'Não especificado',
      serviceType: record.service?.type || 'servico',
      category: record.service?.category || '-',
      client: record.client?.name || 'Não especificado',
      date: record.date,
      paymentMethod: record.paymentMethod || 'Não especificado',
      commissionAmount: Number(record.commissionAmount || 0),
      serviceValue: Number(record.serviceValue || record.service?.price || 0),
      tipAmount: Number(record.tipAmount || 0)
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
    totalTips,
    topServices,
    topClient,
    paymentMethodStats,
    serviceRecordsList,
    loading
  };
};

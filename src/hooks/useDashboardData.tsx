
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
  
  // Calculate start (Monday) and end (Sunday) of the current week
  const startOfCurrentWeek = startOfWeek(localNow, { weekStartsOn: 1 }); // 1 = Monday
  const endOfCurrentWeek = endOfWeek(localNow, { weekStartsOn: 1 }); // Week ends on Sunday
  
  // Calculate start and end of current month
  const startOfCurrentMonth = startOfMonth(localNow);
  const endOfCurrentMonth = endOfMonth(localNow);
  
  const { currentUser } = useAuth();
  const [dateFilter, setDateFilter] = useState('week'); // Default to show last 7 days
  const [startDate, setStartDate] = useState<Date | undefined>(startOfCurrentWeek);
  const [endDate, setEndDate] = useState<Date | undefined>(endOfCurrentWeek);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [serviceRecords, setServiceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('[DASHBOARD DEBUG] Data atual local:', format(localNow, 'yyyy-MM-dd HH:mm:ss'));
  console.log('[DASHBOARD DEBUG] Semana atual - Início:', format(startOfCurrentWeek, 'yyyy-MM-dd'));
  console.log('[DASHBOARD DEBUG] Semana atual - Fim:', format(endOfCurrentWeek, 'yyyy-MM-dd'));
  
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
          `)
          .range(0, 9999)
          .order('date', { ascending: false });

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

        console.log('[DASHBOARD DEBUG] Total de registros carregados:', formattedRecords.length);
        console.log('[DASHBOARD DEBUG] Primeiros 3 registros:', formattedRecords.slice(0, 3).map(r => ({ date: r.date, service: r.service?.name, client: r.client?.name })));
        console.log('[DASHBOARD DEBUG] Últimos 3 registros:', formattedRecords.slice(-3).map(r => ({ date: r.date, service: r.service?.name, client: r.client?.name })));
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
    console.log('[FILTER DEBUG] Aplicando filtros - dateFilter:', dateFilter, 'startDate:', startDate, 'endDate:', endDate);
    console.log('[FILTER DEBUG] Total de registros antes dos filtros:', serviceRecords.length);
    
    let records = [...serviceRecords];
    
    // Filter by professional if selected
    if (selectedProfessional && selectedProfessional !== 'all') {
      records = records.filter(record => record.teamMember.id === selectedProfessional);
      console.log('[FILTER DEBUG] Após filtro de profissional:', records.length);
    } else if (currentUser && !currentUser.isManager) {
      // Non-managers can only see their own records
      records = records.filter(record => record.teamMember.id === currentUser.id);
      console.log('[FILTER DEBUG] Após filtro de usuário não-gerente:', records.length);
    }
    
    // Filter by product/service type
    if (selectedType !== 'all') {
      records = records.filter(record => record.service.type === selectedType);
      console.log('[FILTER DEBUG] Após filtro de tipo:', records.length);
    }
    
    // Apply date filter
    if (dateFilter === 'today') {
      const todayStr = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');
      console.log('[FILTER DEBUG] Filtro "hoje" - comparando com:', todayStr);
      records = records.filter(record => record.date === todayStr);
      console.log('[FILTER DEBUG] Registros após filtro "hoje":', records.length);
    } else if (dateFilter === 'week') {
      // Semana atual (segunda a domingo) em horário de Brasília
      const startStr = format(startOfCurrentWeek, 'yyyy-MM-dd');
      const endStr = format(endOfCurrentWeek, 'yyyy-MM-dd');
      console.log('[FILTER DEBUG] Filtro "semana atual" - de', startStr, 'até', endStr);
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
      console.log('[FILTER DEBUG] Registros após filtro "semana atual":', records.length);
    } else if (dateFilter === 'month') {
      // Últimos 30 dias (inclusivo)
      const endStr = format(localNow, 'yyyy-MM-dd');
      const oneMonthAgo = new Date(localNow);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const startStr = format(oneMonthAgo, 'yyyy-MM-dd');
      console.log('[FILTER DEBUG] Filtro "mês" - de', startStr, 'até', endStr);
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
      console.log('[FILTER DEBUG] Registros após filtro "mês":', records.length);
    } else if (dateFilter === 'custom' && startDate && endDate) {
      // Comparação inclusiva por data (YYYY-MM-DD)
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');
      console.log('[FILTER DEBUG] Filtro "custom" - de', startStr, 'até', endStr);
      records = records.filter(record => record.date >= startStr && record.date <= endStr);
      console.log('[FILTER DEBUG] Registros após filtro "custom":', records.length);
    } else {
      console.log('[FILTER DEBUG] Sem filtro de data (all) - mostrando todos os registros');
    }
    
    // Sort records by date (newest first)
    records.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    
    console.log('[FILTER DEBUG] Total de registros APÓS todos os filtros:', records.length);
    if (records.length > 0) {
      console.log('[FILTER DEBUG] Data mais antiga:', records[records.length - 1]?.date);
      console.log('[FILTER DEBUG] Data mais recente:', records[0]?.date);
    }
    
    return records;
  }, [serviceRecords, dateFilter, startDate, endDate, selectedProfessional, selectedType, currentUser]);

  // Filter expenses using the SAME date filter as service records
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    const todayStr = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');
    const weekStart = format(startOfCurrentWeek, 'yyyy-MM-dd');
    const weekEnd = format(endOfCurrentWeek, 'yyyy-MM-dd');
    const oneMonthAgo = new Date(localNow);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthStart = format(oneMonthAgo, 'yyyy-MM-dd');
    const monthEnd = format(localNow, 'yyyy-MM-dd');

    return expenses.filter((expense) => {
      if (!expense.expense_date) return false;
      const d = expense.expense_date;

      if (dateFilter === 'today') return d === todayStr;
      if (dateFilter === 'week') return d >= weekStart && d <= weekEnd;
      if (dateFilter === 'month') return d >= monthStart && d <= monthEnd;
      if (dateFilter === 'custom' && startDate && endDate) {
        const s = format(startDate, 'yyyy-MM-dd');
        const e = format(endDate, 'yyyy-MM-dd');
        return d >= s && d <= e;
      }
      return true; // 'all'
    });
  }, [expenses, dateFilter, startDate, endDate, startOfCurrentWeek, endOfCurrentWeek, localNow]);

  // Calculate expenses using filtered expenses
  const totalExpenses = filteredExpenses.reduce((total, expense) => total + Number(expense.amount), 0);

  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalCommissions = filteredRecords.reduce((total, record) => total + Number(record.commissionAmount || 0), 0);
  const totalServiceValue = filteredRecords.reduce((total, record) => total + Number(record.serviceValue || record.service?.price || 0), 0);
  const totalRevenue = totalServiceValue; // Revenue is the total value of all services/products
  const totalTips = filteredRecords.reduce((total, record) => total + Number(record.tipAmount || 0), 0);
  const netProfit = totalRevenue - totalExpenses - totalCommissions; // Net profit = revenue - expenses - commissions
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

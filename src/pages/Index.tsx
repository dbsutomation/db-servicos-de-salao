
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { serviceRecords, teamMembers } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

const Index = () => {
  const { currentUser } = useAuth();
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      professional: "all"
    }
  });

  // If user is not a manager, pre-filter by their ID
  useEffect(() => {
    if (currentUser && !currentUser.isManager) {
      setSelectedProfessional(String(currentUser.id));
    }
  }, [currentUser]);

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    let records = [...serviceRecords];
    
    // Filter by professional if selected
    if (selectedProfessional && selectedProfessional !== 'all') {
      const professionalId = parseInt(selectedProfessional);
      records = records.filter(record => record.teamMember.id === professionalId);
    } else if (currentUser && !currentUser.isManager) {
      // Non-managers can only see their own records
      records = records.filter(record => record.teamMember.id === currentUser.id);
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
  }, [serviceRecords, dateFilter, startDate, endDate, selectedProfessional, currentUser]);
  
  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalCommissions = filteredRecords.reduce((total, record) => total + (record.commissionAmount || 0), 0);
  const totalServiceValue = filteredRecords.reduce((total, record) => total + record.service.price, 0);
  const totalRevenue = totalServiceValue - totalCommissions; // Faturamento total = valor serviço - comissão
  const totalClients = new Set(filteredRecords.map(record => record.client.id)).size;
  
  // Calculate most used services
  const topServices = useMemo(() => {
    const serviceCounts = filteredRecords.reduce((acc, record) => {
      const serviceId = record.service.id;
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Get the service with most occurrences
    const entries = Object.entries(serviceCounts);
    if (entries.length === 0) return 'Não disponível (0)';
    
    entries.sort((a, b) => b[1] - a[1]);
    const [serviceId, count] = entries[0];
    const service = filteredRecords.find(r => r.service.id === parseInt(serviceId))?.service;
    
    return service ? `${service.name} (${count})` : 'Não disponível (0)';
  }, [filteredRecords]);

  // Calculate top clients
  const topClient = useMemo(() => {
    const clientCounts = filteredRecords.reduce((acc, record) => {
      const clientId = record.client.id;
      acc[clientId] = (acc[clientId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Get the client with most occurrences
    const entries = Object.entries(clientCounts);
    if (entries.length === 0) return 'Não disponível (0)';
    
    entries.sort((a, b) => b[1] - a[1]);
    const [clientId, count] = entries[0];
    const client = filteredRecords.find(r => r.client.id === parseInt(clientId))?.client;
    
    return client ? `${client.name} (${count})` : 'Não disponível (0)';
  }, [filteredRecords]);
  
  // Prepare chart data - by date
  const chartData = useMemo(() => {
    // Limit to 31 days worth of data maximum
    let dateRange = filteredRecords;
    
    if (startDate && endDate) {
      const dayDiff = differenceInDays(endDate, startDate);
      if (dayDiff > 31) {
        // If more than 31 days, take the most recent 31
        const newStartDate = addDays(endDate, -31);
        dateRange = filteredRecords.filter(record => {
          const recordDate = parseISO(record.date);
          return isAfter(recordDate, newStartDate) && isBefore(recordDate, addDays(endDate, 1));
        });
      }
    }
    
    return dateRange.reduce((acc: any[], record) => {
      const recordDate = record.date;
      const existingDay = acc.find(day => day.date === recordDate);
      
      if (existingDay) {
        existingDay.services += 1;
        existingDay.clients = new Set([...existingDay.clientsSet, record.client.id]).size;
      } else {
        acc.push({
          date: recordDate,
          services: 1,
          clients: 1,
          clientsSet: new Set([record.client.id])
        });
      }
      
      return acc;
    }, []);
  }, [filteredRecords, startDate, endDate]);
  
  // Sort by date and remove the clientsSet (used only for calculation)
  const sortedChartData = useMemo(() => {
    return chartData
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(({ clientsSet, ...rest }) => ({
        ...rest,
        date: format(new Date(rest.date), 'dd/MM')
      }));
  }, [chartData]);
  
  // Show individual service records instead of grouping by professional
  const serviceRecordsList = useMemo(() => {
    return filteredRecords.map(record => ({
      id: record.id,
      professional: record.teamMember.name,
      profession: record.teamMember.profession,
      service: record.service.name,
      client: record.client.name,
      date: record.date,
      commissionAmount: record.commissionAmount || 0,
      serviceValue: record.service.price
    }));
  }, [filteredRecords]);

  const onProfessionalChange = (value: string) => {
    setSelectedProfessional(value);
    form.setValue("professional", value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data inicial'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                <span>até</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data final'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Professional filter */}
            {(currentUser?.isManager) && (
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="professional"
                  render={() => (
                    <FormItem>
                      <Select 
                        value={selectedProfessional || "all"} 
                        onValueChange={onProfessionalChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Todos os profissionais" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os profissionais</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={String(member.id)}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </Form>
            )}
            
            <Link to="/services">
              <Button className="bg-salon-purple hover:bg-salon-dark-purple">
                Novo Registro
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total de Serviços</CardDescription>
              <CardTitle className="text-3xl">{totalServices}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
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
          
          <Card>
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
          
          <Card>
            <CardHeader>
              <CardDescription>Clientes Atendidos</CardDescription>
              <CardTitle className="text-3xl">{totalClients}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Serviço Mais Realizado</CardDescription>
              <CardTitle className="text-2xl">{topServices}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Cliente com Mais Serviços</CardDescription>
              <CardTitle className="text-2xl">{topClient}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Services and Clients Line Chart */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Serviços e Clientes por Dia</h2>
          <Card className="p-4 w-full">
            <ChartContainer 
              config={{
                services: { label: "Serviços", color: "#9b87f5" },
                clients: { label: "Clientes", color: "#f97316" }
              }}
              className="h-80 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={sortedChartData} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="services" 
                    name="Serviços" 
                    stroke="var(--color-services)" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="clients" 
                    name="Clientes" 
                    stroke="var(--color-clients)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>

        {/* Services Records List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Serviços realizados</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor Comissão</TableHead>
                  <TableHead className="text-right">Valor Serviço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRecordsList.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{record.professional}</TableCell>
                    <TableCell>{record.service}</TableCell>
                    <TableCell>{record.client}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency', 
                        currency: 'BRL'
                      }).format(record.commissionAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency', 
                        currency: 'BRL'
                      }).format(record.serviceValue)}
                    </TableCell>
                  </TableRow>
                ))}
                {serviceRecordsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      Nenhum dado para o período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold bg-[#ea384c]/20">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency', 
                      currency: 'BRL'
                    }).format(totalCommissions)}
                  </TableCell>
                  <TableCell className="text-right font-bold bg-[#F2FCE2]">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency', 
                      currency: 'BRL'
                    }).format(totalServiceValue)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

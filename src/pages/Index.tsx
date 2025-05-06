
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { serviceRecords, teamMembers } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Expense } from '@/types';

// Mock expenses data (from Records.tsx)
const initialExpenses: Expense[] = [
  { id: 1, name: 'Aluguel', description: 'Aluguel mensal do salão', amount: 2500 },
  { id: 2, name: 'Água', description: 'Conta de água', amount: 150 },
  { id: 3, name: 'Luz', description: 'Conta de energia elétrica', amount: 350 },
  { id: 4, name: 'Internet', description: 'Serviço de internet', amount: 120 }
];

const Index = () => {
  const { currentUser } = useAuth();
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const form = useForm({
    defaultValues: {
      professional: "all",
      type: "all"
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
    }, {} as Record<number, number>);

    // Get the service with most occurrences
    const entries = Object.entries(serviceCounts);
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [serviceId, count] = entries[0];
    const service = filteredRecords.find(r => r.service.id === parseInt(serviceId))?.service;
    
    return service ? { name: service.name, count } : { name: 'Não disponível', count: 0 };
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
    if (entries.length === 0) return { name: 'Não disponível', count: 0 };
    
    entries.sort((a, b) => b[1] - a[1]);
    const [clientId, count] = entries[0];
    const client = filteredRecords.find(r => r.client.id === parseInt(clientId))?.client;
    
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

  const onProfessionalChange = (value: string) => {
    setSelectedProfessional(value);
    form.setValue("professional", value);
  };

  const onTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("type", value);
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
            
            {/* Type filter (Product/Service) */}
            <Form {...form}>
              <FormField
                control={form.control}
                name="type"
                render={() => (
                  <FormItem>
                    <Select 
                      value={selectedType} 
                      onValueChange={onTypeChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="servico">Apenas Serviços</SelectItem>
                        <SelectItem value="produto">Apenas Produtos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </Form>
            
            <Link to="/services">
              <Button className="bg-salon-purple hover:bg-salon-dark-purple">
                Novo Registro
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Stats Cards */}
        <h2 className="text-xl font-semibold">Indicadores Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          
          <Card>
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
        </div>

        {/* Stats by payment method */}
        <h2 className="text-xl font-semibold">Pagamentos por Método</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentMethodStats.map(({method, amount}) => (
            <Card key={method}>
              <CardHeader>
                <CardDescription>Pagamentos em {method}</CardDescription>
                <CardTitle className="text-2xl">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency', 
                    currency: 'BRL'
                  }).format(amount)}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
          {paymentMethodStats.length === 0 && (
            <Card className="col-span-full">
              <CardHeader>
                <CardDescription>Nenhum pagamento registrado no período</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Quantity Stats Cards */}
        <h2 className="text-xl font-semibold">Indicadores de Quantidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total de Serviços</CardDescription>
              <CardTitle className="text-3xl">{totalServices}</CardTitle>
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
              <CardTitle className="text-2xl">
                {topServices.name} ({topServices.count})
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardDescription>Cliente com Mais Serviços</CardDescription>
              <CardTitle className="text-2xl">
                {topClient.name} ({topClient.count})
              </CardTitle>
            </CardHeader>
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
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRecordsList.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{record.professional}</TableCell>
                    <TableCell>{record.service}</TableCell>
                    <TableCell>{record.serviceType === 'produto' ? 'Produto' : 'Serviço'}</TableCell>
                    <TableCell>{record.category}</TableCell>
                    <TableCell>{record.client}</TableCell>
                    <TableCell>{record.paymentMethod}</TableCell>
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
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      Nenhum dado para o período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="font-bold">Total</TableCell>
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

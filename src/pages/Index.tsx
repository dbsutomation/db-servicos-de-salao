
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { serviceRecords } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Index = () => {
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Apply date filter to records
  let filteredRecords = [...serviceRecords];
  
  // Apply date filter
  if (dateFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filteredRecords = filteredRecords.filter(record => record.date === today);
  } else if (dateFilter === 'week') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filteredRecords = filteredRecords.filter(record => 
      new Date(record.date) >= oneWeekAgo
    );
  } else if (dateFilter === 'month') {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    filteredRecords = filteredRecords.filter(record => 
      new Date(record.date) >= oneMonthAgo
    );
  } else if (dateFilter === 'custom' && startDate && endDate) {
    filteredRecords = filteredRecords.filter(record => {
      const recordDate = parseISO(record.date);
      return isAfter(recordDate, startDate) && isBefore(recordDate, addDays(endDate, 1));
    });
  }
  
  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalRevenue = filteredRecords.reduce((total, record) => total + record.service.price, 0);
  const totalClients = new Set(filteredRecords.map(record => record.client.id)).size;
  
  // Prepare chart data - by date
  const chartData = filteredRecords.reduce((acc: any[], record) => {
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
  
  // Sort by date and remove the clientsSet (used only for calculation)
  const sortedChartData = chartData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(({ clientsSet, ...rest }) => ({
      ...rest,
      date: format(new Date(rest.date), 'dd/MM')
    }));
  
  // Prepare commission data by professional
  const commissionsByProfessional = filteredRecords.reduce((acc: any[], record) => {
    const { teamMember, commissionAmount = 0 } = record;
    
    const existingProfessional = acc.find(prof => prof.id === teamMember.id);
    if (existingProfessional) {
      existingProfessional.commissionAmount += commissionAmount;
      existingProfessional.services += 1;
    } else {
      acc.push({
        id: teamMember.id,
        name: teamMember.name,
        profession: teamMember.profession,
        commissionAmount: commissionAmount,
        services: 1
      });
    }
    
    return acc;
  }, []);
  
  const totalCommissions = commissionsByProfessional.reduce(
    (total, prof) => total + prof.commissionAmount, 0
  );

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
            
            <Link to="/services">
              <Button className="bg-salon-purple hover:bg-salon-dark-purple">
                Novo Registro
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardDescription>Total de Serviços</CardDescription>
              <CardTitle className="text-3xl">{totalServices}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
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
            <CardHeader>
              <CardDescription>Clientes Atendidos</CardDescription>
              <CardTitle className="text-3xl">{totalClients}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Services and Clients Line Chart */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Serviços e Clientes por Dia</h2>
          <Card className="p-4">
            <ChartContainer 
              config={{
                services: { label: "Serviços", color: "#9b87f5" },
                clients: { label: "Clientes", color: "#f97316" }
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="services" 
                    name="Serviços" 
                    stroke="var(--color-services)" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clients" 
                    name="Clientes" 
                    stroke="var(--color-clients)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>

        {/* Commissions by Professional */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Comissões por Profissional</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Serviços Realizados</TableHead>
                  <TableHead className="text-right">Valor Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionsByProfessional.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">{professional.name}</TableCell>
                    <TableCell>{professional.profession}</TableCell>
                    <TableCell className="text-right">{professional.services}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency', 
                        currency: 'BRL'
                      }).format(professional.commissionAmount)}
                    </TableCell>
                  </TableRow>
                ))}
                {commissionsByProfessional.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Nenhum dado para o período selecionado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <tfoot>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency', 
                      currency: 'BRL'
                    }).format(totalCommissions)}
                  </TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

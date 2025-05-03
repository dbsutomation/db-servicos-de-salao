
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { serviceRecords } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Index = () => {
  const [dateFilter, setDateFilter] = useState('all');
  
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
  }
  
  // Calculate quick stats
  const totalServices = filteredRecords.length;
  const totalRevenue = filteredRecords.reduce((total, record) => total + record.service.price, 0);
  
  const recentRecords = filteredRecords.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
            
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
              <CardTitle className="text-3xl">
                {new Set(filteredRecords.map(record => record.client.id)).size}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Records */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Registros Recentes</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-4 text-left">Data</th>
                  <th className="py-3 px-4 text-left">Serviço</th>
                  <th className="py-3 px-4 text-left">Cliente</th>
                  <th className="py-3 px-4 text-left">Profissional</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/50">
                    <td className="py-3 px-4">{record.date}</td>
                    <td className="py-3 px-4">{record.service.name}</td>
                    <td className="py-3 px-4">{record.client.name}</td>
                    <td className="py-3 px-4">{record.teamMember.name}</td>
                    <td className="py-3 px-4 text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency', 
                        currency: 'BRL'
                      }).format(record.service.price)}
                    </td>
                  </tr>
                ))}
                {recentRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Nenhum registro encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right">
            <Link to="/records">
              <Button variant="outline">Ver todos os registros</Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;

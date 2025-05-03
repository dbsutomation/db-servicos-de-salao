
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serviceRecords } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const Records = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

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

  // Apply search filter
  if (searchTerm) {
    filteredRecords = filteredRecords.filter(record => 
      record.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.teamMember.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort by date (newest first)
  filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalRecords = filteredRecords.length;
  const totalRevenue = filteredRecords.reduce((total, record) => total + record.service.price, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Registros</h1>
          
          <Link to="/services">
            <Button className="bg-salon-purple hover:bg-salon-dark-purple">
              Novo Registro
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Registros</CardDescription>
              <CardTitle>{totalRecords}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Valor Total</CardDescription>
              <CardTitle>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalRevenue)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por serviço, cliente ou profissional" 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
              {filteredRecords.map((record) => (
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
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Records;

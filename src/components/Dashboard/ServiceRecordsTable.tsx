
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ServiceRecord {
  id: number;
  professional: string;
  profession: string;
  service: string;
  serviceType: string;
  category: string;
  client: string;
  date: string;
  paymentMethod: string;
  commissionAmount: number;
  serviceValue: number;
}

interface ServiceRecordsTableProps {
  serviceRecordsList: ServiceRecord[];
  totalCommissions: number;
  totalServiceValue: number;
}

const ServiceRecordsTable: React.FC<ServiceRecordsTableProps> = ({ 
  serviceRecordsList,
  totalCommissions,
  totalServiceValue
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Função de filtro para a busca
  const filteredRecords = serviceRecordsList.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.professional.toLowerCase().includes(searchLower) ||
      record.service.toLowerCase().includes(searchLower) ||
      record.serviceType.toLowerCase().includes(searchLower) ||
      record.category.toLowerCase().includes(searchLower) ||
      record.client.toLowerCase().includes(searchLower) ||
      record.paymentMethod.toLowerCase().includes(searchLower) ||
      format(new Date(record.date), 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Serviços realizados</h2>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Buscar" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <Card className="shadow-md border-2 border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
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
            {filteredRecords.map((record) => (
              <TableRow key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
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
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "Nenhum resultado encontrado para a busca" : "Nenhum dado para o período selecionado"}
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
  );
};

export default ServiceRecordsTable;

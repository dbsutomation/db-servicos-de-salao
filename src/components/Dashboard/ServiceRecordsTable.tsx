
import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

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
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Serviços realizados</h2>
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
            {serviceRecordsList.map((record) => (
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
  );
};

export default ServiceRecordsTable;


import React, { useState } from 'react';
import { format as dateFormat } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseISO } from 'date-fns';

// Define a local type for the records the component will use
interface DisplayServiceRecord {
  id: string;
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
  serviceRecordsList: DisplayServiceRecord[];
  totalCommissions: number;
  totalServiceValue: number;
}

const formSchema = z.object({
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  serviceValue: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
  commissionAmount: z.coerce.number().min(0, "Comissão deve ser maior ou igual a zero"),
});

type FormValues = z.infer<typeof formSchema>;

const ServiceRecordsTable: React.FC<ServiceRecordsTableProps> = ({ 
  serviceRecordsList,
  totalCommissions,
  totalServiceValue
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<DisplayServiceRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentMethod: '',
      serviceValue: 0,
      commissionAmount: 0,
    },
  });

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
      dateFormat(parseISO(record.date), 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  const handleEdit = (record: DisplayServiceRecord) => {
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem editar registros de serviços.",
        variant: "destructive",
      });
      return;
    }

    setSelectedRecord(record);
    form.reset({
      paymentMethod: record.paymentMethod,
      serviceValue: record.serviceValue,
      commissionAmount: record.commissionAmount,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (record: DisplayServiceRecord) => {
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem excluir registros de serviços.",
        variant: "destructive",
      });
      return;
    }

    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from('service_records')
        .delete()
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast({
        title: "Registro excluído",
        description: "O registro de serviço foi removido com sucesso.",
      });

      // Force reload to update the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro ao excluir o registro.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from('service_records')
        .update({
          payment_method: data.paymentMethod,
          service_value: data.serviceValue,
          commission_amount: data.commissionAmount,
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast({
        title: "Registro atualizado",
        description: "O registro de serviço foi atualizado com sucesso.",
      });

      // Force reload to update the list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o registro.",
        variant: "destructive",
      });
    } finally {
      setEditDialogOpen(false);
      setSelectedRecord(null);
    }
  };

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
              {currentUser?.isManager && <TableHead className="text-center">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                <TableCell>{dateFormat(parseISO(record.date), 'dd/MM/yyyy')}</TableCell>
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
                {currentUser?.isManager && (
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(record)}
                        className="h-8 w-8"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(record)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={currentUser?.isManager ? 10 : 9} className="text-center py-4 text-muted-foreground">
                  {searchTerm ? "Nenhum resultado encontrado para a busca" : "Nenhum dado para o período selecionado"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={currentUser?.isManager ? 7 : 6} className="font-bold">Total</TableCell>
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
              {currentUser?.isManager && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Serviço</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commissionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Comissão</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceRecordsTable;

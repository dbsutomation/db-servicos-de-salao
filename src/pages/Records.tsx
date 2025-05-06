
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Add expense type
export interface Expense {
  id: number;
  name: string;
  description: string;
  amount: number;
}

// Initial expenses data
const initialExpenses: Expense[] = [
  { id: 1, name: 'Aluguel', description: 'Aluguel mensal do salão', amount: 2500 },
  { id: 2, name: 'Água', description: 'Conta de água', amount: 150 },
  { id: 3, name: 'Luz', description: 'Conta de energia elétrica', amount: 350 },
  { id: 4, name: 'Internet', description: 'Serviço de internet', amount: 120 }
];

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, { message: 'Valor deve ser maior que 0' })
});

type FormValues = z.infer<typeof formSchema>;

const Records = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<number | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0
    }
  });

  const handleEditExpense = (expense: Expense) => {
    // Only managers can edit expenses
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem editar despesas.",
        variant: "destructive"
      });
      return;
    }
    
    setEditExpenseId(expense.id);
    form.reset({
      name: expense.name,
      description: expense.description,
      amount: expense.amount
    });
    setDialogOpen(true);
  };

  const confirmDeleteExpense = (expense: Expense) => {
    // Only managers can delete expenses
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem excluir despesas.",
        variant: "destructive"
      });
      return;
    }
    
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteExpense = () => {
    if (expenseToDelete) {
      setExpenses(expenses.filter(expense => expense.id !== expenseToDelete.id));
      toast({
        title: "Despesa removida",
        description: `${expenseToDelete.name} foi removida com sucesso.`
      });
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (editExpenseId) {
      // Update existing expense
      setExpenses(
        expenses.map(expense => 
          expense.id === editExpenseId 
            ? { 
                ...expense, 
                name: data.name, 
                description: data.description || '', 
                amount: data.amount 
              } 
            : expense
        )
      );
      toast({
        title: "Despesa atualizada",
        description: `${data.name} foi atualizada com sucesso.`
      });
    } else {
      // Create new expense
      const newExpense: Expense = {
        id: Math.max(0, ...expenses.map(e => e.id)) + 1,
        name: data.name,
        description: data.description || '',
        amount: data.amount
      };
      setExpenses([...expenses, newExpense]);
      toast({
        title: "Despesa adicionada",
        description: `${data.name} foi adicionada com sucesso.`
      });
    }
    
    form.reset({
      name: '',
      description: '',
      amount: 0
    });
    setDialogOpen(false);
    setEditExpenseId(null);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Registro de Despesas</h1>
          
          {currentUser?.isManager && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-salon-purple hover:bg-salon-dark-purple"
                  onClick={() => {
                    setEditExpenseId(null);
                    form.reset({
                      name: '',
                      description: '',
                      amount: 0
                    });
                  }}
                >
                  <Plus className="mr-2" size={18} />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editExpenseId ? 'Editar Despesa' : 'Adicionar Nova Despesa'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da despesa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descrição da despesa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editExpenseId ? 'Salvar' : 'Adicionar'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {currentUser?.isManager && <TableHead className="text-center w-24">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.name}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(expense.amount)}
                  </TableCell>
                  {currentUser?.isManager && (
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExpense(expense)}
                          className="h-8 w-8"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteExpense(expense)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={currentUser?.isManager ? 4 : 3} className="text-center py-6 text-gray-500">
                    Nenhuma despesa registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end">
          <div className="bg-[#ea384c]/20 px-4 py-2 rounded-lg">
            <span className="font-semibold">Total de Despesas:</span>{' '}
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalExpenses)}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa "{expenseToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Records;

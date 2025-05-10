
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Expense } from '@/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  description: z.string().optional(),
  amount: z.coerce.number().min(0, { message: 'Valor deve ser maior que 0' })
});

type FormValues = z.infer<typeof formSchema>;

const Records = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0
    }
  });

  // Fetching expenses from Supabase
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setExpenses(data as Expense[]);
        }
      } catch (error: any) {
        toast({
          title: "Erro ao buscar despesas",
          description: error.message || "Não foi possível carregar as despesas.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [toast]);

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
      amount: expense.amount as number
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

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseToDelete.id);

        if (error) throw error;

        setExpenses(expenses.filter(expense => expense.id !== expenseToDelete.id));
        toast({
          title: "Despesa removida",
          description: `${expenseToDelete.name} foi removida com sucesso.`
        });
      } catch (error: any) {
        toast({
          title: "Erro ao remover despesa",
          description: error.message || "Não foi possível remover a despesa.",
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (editExpenseId) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            name: data.name,
            description: data.description || '',
            amount: data.amount
          })
          .eq('id', editExpenseId);

        if (error) throw error;

        // Update local state
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
        const { data: newExpense, error } = await supabase
          .from('expenses')
          .insert({
            name: data.name,
            description: data.description || '',
            amount: data.amount
          })
          .select('*')
          .single();

        if (error) throw error;

        // Add to local state
        setExpenses([newExpense as Expense, ...expenses]);
        
        toast({
          title: "Despesa adicionada",
          description: `${data.name} foi adicionada com sucesso.`
        });
      }
    } catch (error: any) {
      toast({
        title: editExpenseId ? "Erro ao atualizar despesa" : "Erro ao adicionar despesa",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    form.reset({
      name: '',
      description: '',
      amount: 0
    });
    setDialogOpen(false);
    setEditExpenseId(null);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount as number), 0);

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={currentUser?.isManager ? 4 : 3} className="text-center py-6">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(expense.amount as number)}
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
                ))
              ) : (
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

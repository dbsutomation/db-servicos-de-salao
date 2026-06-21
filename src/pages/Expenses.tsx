import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';
import { Expense } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FormState {
  name: string;
  amount: string;
  expense_date: string;
  is_fixed: boolean;
  description: string;
}

const emptyForm = (): FormState => ({
  name: '',
  amount: '',
  expense_date: format(new Date(), 'yyyy-MM-dd'),
  is_fixed: false,
  description: '',
});

const Expenses = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      setExpenses((data || []) as Expense[]);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar despesas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      name: expense.name,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      is_fixed: expense.is_fixed,
      description: expense.description || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount),
      expense_date: form.expense_date,
      is_fixed: form.is_fixed,
      description: form.description.trim() || null,
    };

    if (!payload.name || isNaN(payload.amount) || payload.amount <= 0 || !payload.expense_date) {
      toast({ title: 'Dados inválidos', description: 'Preencha nome, valor e data corretamente.', variant: 'destructive' });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Despesa atualizada' });
      } else {
        const salonId = await getCurrentSalonId();
        const { error } = await supabase.from('expenses').insert({ ...payload, salon_id: salonId } as any);
        if (error) throw error;
        toast({ title: 'Despesa adicionada' });
      }
      setDialogOpen(false);
      setEditingId(null);
      fetchExpenses();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const confirmDelete = (id: string) => {
    setToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', toDelete);
      if (error) throw error;
      toast({ title: 'Despesa removida' });
      setExpenses((prev) => prev.filter((e) => e.id !== toDelete));
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setToDelete(null);
    }
  };

  const filtered = expenses.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!currentUser?.isManager) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-gray-500">Acesso restrito a gerentes.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Despesas</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-salon-purple hover:bg-salon-dark-purple shadow-md" onClick={openNew}>
                <Plus className="mr-2" size={18} />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input id="amount" type="number" step="0.01" min="0" value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Data</Label>
                    <Input id="expense_date" type="date" value={form.expense_date}
                      onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="is_fixed" className="text-base">Despesa Fixa</Label>
                    <p className="text-sm text-muted-foreground">Marque se for uma despesa recorrente</p>
                  </div>
                  <Switch id="is_fixed" checked={form.is_fixed}
                    onCheckedChange={(checked) => setForm({ ...form, is_fixed: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea id="description" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="bg-salon-purple hover:bg-salon-dark-purple">
                    {editingId ? 'Salvar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar despesas"
            className="pl-10 border-2 border-gray-200 shadow-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando despesas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
            {searchTerm ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa cadastrada'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Nome</th>
                    <th className="text-left p-4 font-medium">Valor</th>
                    <th className="text-left p-4 font-medium">Data</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium">{e.name}</div>
                        {e.description && <div className="text-sm text-gray-500">{e.description}</div>}
                      </td>
                      <td className="p-4">{formatBRL(Number(e.amount))}</td>
                      <td className="p-4">{format(parseISO(e.expense_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                      <td className="p-4">
                        <Badge variant={e.is_fixed ? 'default' : 'secondary'}>
                          {e.is_fixed ? 'Fixa' : 'Variável'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)} className="h-8 w-8">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(e.id)} className="h-8 w-8 text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Expenses;

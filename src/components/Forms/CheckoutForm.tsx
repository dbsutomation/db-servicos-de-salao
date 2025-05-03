
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { clients, teamMembers, serviceRecords } from '@/data/mockData';
import { ServiceRecord } from '@/types';
import ClientForm from './ClientForm';
import TeamMemberForm from './TeamMemberForm';

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Selecione um cliente' }),
  teamMemberId: z.string().min(1, { message: 'Selecione um profissional' }),
});

type FormValues = z.infer<typeof formSchema>;

interface CheckoutFormProps {
  onSuccess: () => void;
}

const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      teamMemberId: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione serviços ao carrinho para finalizar o registro.',
        variant: 'destructive',
      });
      return;
    }

    const client = clients.find(c => c.id.toString() === values.clientId);
    const teamMember = teamMembers.find(t => t.id.toString() === values.teamMemberId);

    if (!client || !teamMember) {
      toast({
        title: 'Erro no registro',
        description: 'Cliente ou profissional não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would be an API call to register the services
    cartItems.forEach(item => {
      const today = new Date().toISOString().split('T')[0];
      
      const newRecord: ServiceRecord = {
        id: serviceRecords.length + 1,
        service: item.service,
        teamMember,
        client,
        date: today,
      };

      serviceRecords.push(newRecord);
    });

    toast({
      title: 'Registro concluído',
      description: 'Os serviços foram registrados com sucesso.',
    });

    clearCart();
    form.reset();
    onSuccess();
  };

  const handleClientFormSuccess = () => {
    setClientDialogOpen(false);
    // Re-render will show new client in the dropdown
  };

  const handleTeamMemberFormSuccess = () => {
    setTeamDialogOpen(false);
    // Re-render will show new team member in the dropdown
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClientForm onSuccess={handleClientFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="teamMemberId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Profissional</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} - {member.profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">Novo Profissional</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Profissional</DialogTitle>
              </DialogHeader>
              <TeamMemberForm onSuccess={handleTeamMemberFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="border-t pt-6">
          <div className="flex justify-between font-semibold text-lg mb-6">
            <span>Total:</span>
            <span>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(getCartTotal())}
            </span>
          </div>
          
          <Button type="submit" className="w-full">Finalizar Registro</Button>
        </div>
      </form>
    </Form>
  );
};

export default CheckoutForm;

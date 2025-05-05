
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clients } from '@/data/mockData';
import { Client } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  phone: z.string().min(8, { message: 'O telefone deve ter pelo menos 8 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }).or(z.string().length(0)),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSuccess: () => void;
  clientId?: number | null;
}

const ClientForm = ({ onSuccess, clientId }: ClientFormProps) => {
  const { toast } = useToast();
  const isEditing = clientId !== undefined && clientId !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
    },
  });

  // Load client data if editing
  useEffect(() => {
    if (isEditing) {
      const clientToEdit = clients.find(c => c.id === clientId);
      if (clientToEdit) {
        form.reset({
          name: clientToEdit.name,
          phone: clientToEdit.phone,
          email: clientToEdit.email || '',
        });
      }
    }
  }, [clientId, isEditing, form]);

  const onSubmit = (data: FormValues) => {
    try {
      if (isEditing) {
        // Find the client in our mock data
        const clientIndex = clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
          // Update the client
          clients[clientIndex] = {
            ...clients[clientIndex],
            name: data.name,
            phone: data.phone,
            email: data.email || undefined,
          };
          toast({
            title: 'Cliente atualizado',
            description: `${data.name} foi atualizado com sucesso.`,
          });
        }
      } else {
        // Create a new client
        const newClient: Client = {
          id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
        };
        clients.push(newClient);
        toast({
          title: 'Cliente adicionado',
          description: `${data.name} foi adicionado com sucesso.`,
        });
      }
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o cliente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(00) 00000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" className="bg-salon-purple hover:bg-salon-dark-purple">
            {isEditing ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;

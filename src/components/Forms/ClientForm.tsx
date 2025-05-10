
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres'
  }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal(''))
});

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSuccess: (data: ClientFormValues) => void;
  clientId?: string | null;
}

const ClientForm = ({ onSuccess, clientId }: ClientFormProps) => {
  const { toast } = useToast();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    }
  });

  // Populate form when editing an existing client
  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

          if (error) throw error;
          
          if (data) {
            form.reset({
              name: data.name,
              phone: data.phone || '',
              email: data.email || ''
            });
          }
        } catch (error: any) {
          toast({
            title: "Erro ao carregar dados do cliente",
            description: error.message || "Não foi possível carregar os dados do cliente",
            variant: "destructive"
          });
        }
      }
    };

    fetchClientData();
  }, [clientId, form, toast]);

  const onSubmit = (data: ClientFormValues) => {
    onSuccess(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Input type="email" placeholder="exemplo@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit">{clientId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;

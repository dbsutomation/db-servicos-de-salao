
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Schema de validação para o formulário
const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal(''))
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  clientId?: string | null;
  onSuccess: (data: FormValues) => void;
}

const ClientForm = ({ clientId, onSuccess }: ClientFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: ''
    }
  });

  // Carregar dados do cliente se estiver editando
  useEffect(() => {
    if (clientId) {
      setIsLoading(true);
      const fetchClient = async () => {
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
        } catch (error) {
          console.error('Erro ao carregar cliente:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchClient();
    }
  }, [clientId, form]);

  const onSubmit = (data: FormValues) => {
    onSuccess(data);
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
                <Input placeholder="Nome do cliente" {...field} disabled={isLoading} />
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
                <Input placeholder="(00) 00000-0000" {...field} disabled={isLoading} />
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
                <Input placeholder="email@exemplo.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {clientId ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;

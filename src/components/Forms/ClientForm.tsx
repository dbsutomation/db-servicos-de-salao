
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toTitleCase, formatPhoneMask, normalizePhone } from '@/lib/formatters';
import { newClientSchema, editClientSchema, type ClientFormValues } from '@/lib/clientValidation';

interface ClientFormProps {
  onSuccess: (data: ClientFormValues) => void | Promise<boolean | void>;
  clientId?: string | null;
}

const ClientForm = ({ onSuccess, clientId }: ClientFormProps) => {
  const { toast } = useToast();
  const isEditing = !!clientId;
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(isEditing ? editClientSchema : newClientSchema),
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
              phone: formatPhoneMask(data.phone || ''),
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

  const onSubmit = async (data: ClientFormValues) => {
    const normalized = {
      ...data,
      name: toTitleCase(data.name),
      phone: data.phone ? normalizePhone(data.phone) : data.phone,
    };
    const result = await onSuccess(normalized);
    if (result !== false) form.reset();
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
                <Input
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  maxLength={16}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(formatPhoneMask(e.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
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
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="exemplo@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Salvando...' : clientId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;

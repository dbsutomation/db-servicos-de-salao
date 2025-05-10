
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TeamMember } from '@/types';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  profession: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }).or(z.string().length(0)),
  hasAccess: z.boolean().default(true),
  isManager: z.boolean().default(false),
  avatar: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface TeamMemberFormProps {
  member: TeamMember | null;
  onSubmit: (data: TeamMember) => void;
  isLoading: boolean;
}

const TeamMemberForm = ({ member, onSubmit, isLoading }: TeamMemberFormProps) => {
  const isEditMode = !!member?.id;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: member?.id || '',
      name: member?.name || '',
      email: member?.email || '',
      profession: member?.profession || '',
      phone: member?.phone || '',
      password: '',
      hasAccess: member?.hasAccess ?? true,
      isManager: member?.isManager ?? false,
      avatar: member?.avatar || '',
    }
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit({
      id: data.id || '',
      name: data.name,
      email: data.email,
      profession: data.profession || '',
      phone: data.phone || '',
      password: data.password,
      hasAccess: data.hasAccess,
      isManager: data.isManager,
      avatar: data.avatar || '',
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
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
                <Input placeholder="email@exemplo.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditMode ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}</FormLabel>
              <FormControl>
                <Input placeholder="******" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profissão</FormLabel>
              <FormControl>
                <Input placeholder="Cabeleireiro, Manicure, etc." {...field} />
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

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          <FormField
            control={form.control}
            name="hasAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Acesso ao Sistema</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isManager"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Gerente</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : isEditMode ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberForm;

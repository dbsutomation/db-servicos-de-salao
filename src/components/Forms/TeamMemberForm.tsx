
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { teamMembers } from '@/data/mockData';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  profession: z.string().min(2, { message: 'A profissão deve ter pelo menos 2 caracteres' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido' }).optional(),
  password: z.string().default('@123456'),
  isManager: z.boolean().default(false),
  hasLoginAccess: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface TeamMemberFormProps {
  onSuccess?: () => void;
}

const TeamMemberForm = ({ onSuccess }: TeamMemberFormProps) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      profession: '',
      phone: '',
      email: '',
      password: '@123456',
      isManager: false,
      hasLoginAccess: true,
    },
  });

  const onSubmit = (values: FormValues) => {
    // In a real app, this would be an API call
    const newTeamMember = {
      id: teamMembers.length + 1,
      name: values.name,
      profession: values.profession,
      phone: values.phone || undefined,
      email: values.email || undefined,
      password: values.password,
      isManager: values.isManager,
      hasLoginAccess: values.hasLoginAccess,
    };

    // Simulate adding to the database
    teamMembers.push(newTeamMember);
    
    toast({
      title: 'Membro da equipe adicionado',
      description: 'O profissional foi adicionado com sucesso.',
    });

    form.reset();
    
    if (onSuccess) {
      onSuccess();
    }
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
                <Input placeholder="Nome do profissional" {...field} />
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
                <Input placeholder="Cargo ou especialidade" {...field} />
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
                <Input type="email" placeholder="email@exemplo.com" {...field} />
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
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Senha" 
                  {...field} 
                  value={field.value || '@123456'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="isManager"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Gerente</FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="hasLoginAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Acesso ao Sistema</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full">Adicionar Membro</Button>
      </form>
    </Form>
  );
};

export default TeamMemberForm;

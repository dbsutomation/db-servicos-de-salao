
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { teamMembers } from '@/data/mockData';
import { TeamMember } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  profession: z.string().min(2, { message: 'A profissão deve ter pelo menos 2 caracteres' }),
  phone: z.string().min(8, { message: 'O telefone deve ter pelo menos 8 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  isManager: z.boolean().default(false),
  hasLoginAccess: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface TeamMemberFormProps {
  onSuccess: () => void;
  memberId?: number | null;
}

const TeamMemberForm = ({ onSuccess, memberId }: TeamMemberFormProps) => {
  const { toast } = useToast();
  const isEditing = memberId !== undefined && memberId !== null;

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

  // Load team member data if editing
  useEffect(() => {
    if (isEditing) {
      const memberToEdit = teamMembers.find(m => m.id === memberId);
      if (memberToEdit) {
        form.reset({
          name: memberToEdit.name,
          profession: memberToEdit.profession,
          phone: memberToEdit.phone,
          email: memberToEdit.email,
          password: memberToEdit.password || '@123456',
          isManager: memberToEdit.isManager,
          hasLoginAccess: memberToEdit.hasLoginAccess !== false,
        });
      }
    }
  }, [memberId, isEditing, form]);

  const onSubmit = (data: FormValues) => {
    try {
      if (isEditing) {
        // Find the member in our mock data
        const memberIndex = teamMembers.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
          // Update the member
          teamMembers[memberIndex] = {
            ...teamMembers[memberIndex],
            name: data.name,
            profession: data.profession,
            phone: data.phone,
            email: data.email,
            password: data.password,
            isManager: data.isManager,
            hasLoginAccess: data.hasLoginAccess,
          };
          toast({
            title: 'Profissional atualizado',
            description: `${data.name} foi atualizado com sucesso.`,
          });
        }
      } else {
        // Create a new team member
        const newMember: TeamMember = {
          id: teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1,
          name: data.name,
          profession: data.profession,
          phone: data.phone,
          email: data.email,
          password: data.password,
          isManager: data.isManager,
          hasLoginAccess: data.hasLoginAccess,
        };
        teamMembers.push(newMember);
        toast({
          title: 'Profissional adicionado',
          description: `${data.name} foi adicionado com sucesso.`,
        });
      }
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o profissional.',
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
                <Input placeholder="Profissão" {...field} />
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input placeholder="Senha" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col space-y-2">
          <FormField
            control={form.control}
            name="hasLoginAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">Possui acesso ao sistema</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isManager"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">É gerente</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-salon-purple hover:bg-salon-dark-purple">
            {isEditing ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberForm;

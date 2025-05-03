
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { teamMembers } from '@/data/mockData';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  profession: z.string().min(2, { message: 'A profissão deve ter pelo menos 2 caracteres' }),
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
    },
  });

  const onSubmit = (values: FormValues) => {
    // In a real app, this would be an API call
    const newTeamMember = {
      id: teamMembers.length + 1,
      name: values.name,
      profession: values.profession,
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
        
        <Button type="submit" className="w-full">Adicionar Membro</Button>
      </form>
    </Form>
  );
};

export default TeamMemberForm;


import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

// Esquema de validação adaptativo para permitir senha opcional na edição
const formSchema = (isEditing: boolean) => z.object({
  name: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres'
  }),
  profession: z.string().min(2, {
    message: 'Profissão deve ter pelo menos 2 caracteres'
  }),
  phone: z.string().min(10, {
    message: 'Telefone deve ser válido'
  }),
  email: z.string().email({
    message: 'Email deve ser válido'
  }),
  password: isEditing 
    ? z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }).optional().or(z.literal(''))
    : z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  hasAccess: z.boolean(),
  isManager: z.boolean()
});

type TeamMemberFormValues = z.infer<ReturnType<typeof formSchema>>;

interface TeamMemberFormProps {
  onSuccess: (data: TeamMemberFormValues) => void;
  teamMemberId?: string | null;
}

const professions = [
  'Cabelereiro',
  'Barbeiro',
  'Manicure',
  'Pedicure',
  'Esteticista',
  'Maquiador',
  'Depilador',
  'Massagista',
  'Podólogo',
  'Outro'
];

const TeamMemberForm = ({ onSuccess, teamMemberId }: TeamMemberFormProps) => {
  // Configurar o schema baseado se é edição ou criação
  const isEditing = !!teamMemberId;
  const schema = formSchema(isEditing);
  
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      profession: '',
      phone: '',
      email: '',
      password: '',
      hasAccess: isEditing ? undefined : false, // Padrão false para novos membros
      isManager: false
    }
  });

  // Populate form when editing an existing team member
  useEffect(() => {
    if (teamMemberId) {
      console.log("Carregando dados do membro:", teamMemberId);
      
      const fetchTeamMember = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', teamMemberId)
            .single();
          
          if (error) {
            console.error('Error fetching team member:', error);
            return;
          }
          
          if (data) {
            console.log("Dados do membro carregados:", data);
            
            form.reset({
              name: data.name || '',
              profession: data.profession || '',
              phone: data.phone || '',
              email: data.email || '',
              password: '', // Password is not fetched from the database
              hasAccess: data.has_access,
              isManager: data.is_manager
            });
          }
        } catch (error) {
          console.error('Error in fetchTeamMember:', error);
        }
      };

      fetchTeamMember();
    }
  }, [teamMemberId, form]);

  const onSubmit = (data: TeamMemberFormValues) => {
    console.log("Dados do formulário:", data);
    onSuccess(data);
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma profissão" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {professions.map((profession) => (
                    <SelectItem key={profession} value={profession}>
                      {profession}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{teamMemberId ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="hasAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Acesso ao Sistema</FormLabel>
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Perfil de Gerente</FormLabel>
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
        
        <div className="flex justify-end space-x-2">
          <Button type="submit">{teamMemberId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberForm;

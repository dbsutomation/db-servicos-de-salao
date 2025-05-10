import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Client, TeamMember } from '@/types';

const formSchema = z.object({
  client: z.string().min(1, { message: 'Selecione um cliente' }),
  teamMember: z.string().min(1, { message: 'Selecione um profissional' }),
  paymentMethod: z.enum(['debit', 'credit', 'cash', 'pix'], { 
    required_error: 'Selecione uma forma de pagamento' 
  }),
});

interface CheckoutFormProps {
  onSuccess?: () => void;
}

// Mapeamento das formas de pagamento
const paymentMethodLabels: Record<string, string> = {
  'debit': 'Cartão de Débito',
  'credit': 'Cartão de Crédito',
  'cash': 'Dinheiro',
  'pix': 'PIX'
};

const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const { currentUser } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client: "",
      teamMember: "",
      paymentMethod: "pix",
    },
  });

  // Fetch clients and team members
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*');
        
        if (clientsError) throw clientsError;
        
        // Fetch team members
        const { data: teamData, error: teamError } = await supabase
          .from('users')
          .select('*');
          
        if (teamError) throw teamError;
        
        setClients(clientsData || []);
        
        // Map the team data to match TeamMember interface
        const mappedTeamData = teamData?.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          profession: member.profession || '',
          password: '', // This is a placeholder since we don't get passwords from the database
          hasAccess: member.has_access,
          isManager: member.is_manager,
          avatar: member.avatar || ''
        })) as TeamMember[];
        
        setTeamMembers(mappedTeamData);
        
        // Set current user as default team member if available
        if (currentUser?.id) {
          form.setValue('teamMember', currentUser.id);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar clientes ou profissionais',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, form, toast]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const clientId = values.client;
    const teamMemberId = values.teamMember;
    
    const client = clients.find(c => c.id === clientId);
    const teamMember = teamMembers.find(t => t.id === teamMemberId);
    
    if (!client || !teamMember) {
      toast({
        title: "Erro",
        description: "Cliente ou profissional não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Processar cada item do carrinho
      for (const item of cartItems) {
        for (let i = 0; i < item.quantity; i++) {
          const { error } = await supabase
            .from('service_records')
            .insert({
              client_id: client.id,
              professional_id: teamMember.id,
              service_id: item.service.id,
              payment_method: paymentMethodLabels[values.paymentMethod],
              commission_amount: item.service.price * (item.service.commission / 100),
              service_value: item.service.price
            });

          if (error) throw error;
        }
      }
      
      // Show success message
      toast({
        title: "Serviços registrados",
        description: `${cartItems.reduce((total, item) => total + item.quantity, 0)} serviços registrados com sucesso`,
      });
      
      // Clear the cart
      clearCart();
      
      // Navegar para a página de serviços em vez de chamar onSuccess
      navigate('/services');
    } catch (error: any) {
      toast({
        title: "Erro ao registrar serviços",
        description: error.message || "Ocorreu um erro ao salvar os registros",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
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
          name="teamMember"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profissional</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading || (!!currentUser && !currentUser.isManager)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
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
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Forma de Pagamento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 gap-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="debit" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Cartão de Débito
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Cartão de Crédito
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="cash" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Dinheiro
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="pix" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      PIX
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full bg-salon-purple hover:bg-salon-dark-purple" disabled={loading}>
          Finalizar Registro
        </Button>
      </form>
    </Form>
  );
};

export default CheckoutForm;

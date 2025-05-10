
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client, TeamMember } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

// Mapeamento das formas de pagamento
export const paymentMethodLabels: Record<string, string> = {
  'debit': 'Cartão de Débito',
  'credit': 'Cartão de Crédito',
  'cash': 'Dinheiro',
  'pix': 'PIX'
};

export const formSchema = z.object({
  client: z.string().min(1, { message: 'Selecione um cliente' }),
  teamMember: z.string().min(1, { message: 'Selecione um profissional' }),
  paymentMethod: z.enum(['debit', 'credit', 'cash', 'pix'], { 
    required_error: 'Selecione uma forma de pagamento' 
  }),
});

export type CheckoutFormValues = z.infer<typeof formSchema>;

export function useCheckoutForm() {
  const { currentUser } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<CheckoutFormValues>({
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
  const onSubmit = async (values: CheckoutFormValues) => {
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

  return { form, clients, teamMembers, loading, onSubmit };
}

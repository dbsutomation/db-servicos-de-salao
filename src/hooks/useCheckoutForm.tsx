import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client, TeamMember } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';
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
  creditPaymentType: z.enum(['full', 'installments']).optional(),
});

export type CheckoutFormValues = z.infer<typeof formSchema>;

export function useCheckoutForm() {
  const { currentUser } = useAuth();
  const { cartItems, clearCart, getCartTotal, getCartTipsTotal } = useCart();
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
        // Fetch clients (excluindo cliente placeholder de bloqueio de agenda)
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .neq('name', '__BLOQUEADO__')
          .order('name', { ascending: true });
        
        if (clientsError) throw clientsError;
        
        // Fetch team members
        const { data: teamData, error: teamError } = await supabase
          .from('users')
          .select('*');
          
        if (teamError) throw teamError;
        
        // Sort clients alphabetically by name
        const sortedClients = (clientsData || []).sort((a, b) => 
          a.name.localeCompare(b.name, 'pt-BR')
        );
        setClients(sortedClients);
        
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
          receivesCommission: member.receives_commission ?? true,
          avatar: member.avatar || ''
        })) as TeamMember[];
        
        setTeamMembers(mappedTeamData);

        // Pré-seleciona com base em agendamento ativo (vindo da /agenda),
        // senão usa o usuário logado como profissional.
        const activeRaw = sessionStorage.getItem('activeAppointment');
        const active = activeRaw ? JSON.parse(activeRaw) : null;
        if (active?.clientId) form.setValue('client', active.clientId);
        if (active?.professionalId) {
          form.setValue('teamMember', active.professionalId);
        } else if (currentUser?.id) {
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
      console.error('Cliente ou profissional não encontrado');
      toast({
        title: "Erro",
        description: "Cliente ou profissional não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    if (cartItems.length === 0) {
      console.error('Carrinho está vazio');
      toast({
        title: "Erro",
        description: "O carrinho está vazio",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare payment method string
      let paymentMethodString = paymentMethodLabels[values.paymentMethod];
      
      // Add credit payment type if applicable
      if (values.paymentMethod === 'credit' && values.creditPaymentType) {
        paymentMethodString += ` - ${values.creditPaymentType === 'full' ? 'À Vista' : 'Parcelado'}`;
      }

      // Verifica se há agendamento ativo associado
      const activeRaw = sessionStorage.getItem('activeAppointment');
      const active = activeRaw ? JSON.parse(activeRaw) : null;
      const appointmentId: string | null = active?.appointmentId ?? null;

      // Process each cart item
      const salonId = await getCurrentSalonId();
      for (const item of cartItems) {
        const recordData: any = {
          client_id: client.id,
          professional_id: teamMember.id,
          service_id: item.service.id,
          payment_method: paymentMethodString,
          commission_amount: (teamMember.receivesCommission ?? true)
            ? item.service.price * (item.service.commission / 100)
            : 0,
          service_value: item.service.price * item.quantity,
          tip_amount: item.tipAmount || 0,
          salon_id: salonId,
        };
        if (appointmentId) recordData.appointment_id = appointmentId;


        const { data, error } = await supabase
          .from('service_records')
          .insert(recordData as any)
          .select();


        if (error) {
          console.error('Erro ao inserir registro:', error);
          throw error;
        }

      }


      // Se veio de um agendamento, marca como concluído
      if (appointmentId) {
        const { error: apptErr } = await supabase
          .from('appointments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', appointmentId);
        if (apptErr) console.error('Erro ao concluir agendamento:', apptErr);
        sessionStorage.removeItem('activeAppointment');
      }

      // Show success message
      toast({
        title: appointmentId ? "Venda finalizada e agendamento concluído!" : "Serviços registrados",
        description: `${cartItems.reduce((total, item) => total + item.quantity, 0)} serviços registrados com sucesso`,
      });

      
      // Clear the cart
      clearCart();
      
      // Navigate to the home page
      navigate('/');
      
    } catch (error: any) {
      console.error('Erro ao registrar serviços:', error);
      toast({
        title: "Erro ao registrar serviços",
        description: error.message || "Ocorreu um erro ao salvar os registros",
        variant: "destructive",
      });
    }
  };

  const onClientCreated = (client: Client) => {
    setClients(previous => [...previous.filter(existing => existing.id !== client.id), client]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    form.setValue('client', client.id, { shouldValidate: true, shouldDirty: true });
  };

  return { form, clients, teamMembers, loading, onSubmit, onClientCreated };
}

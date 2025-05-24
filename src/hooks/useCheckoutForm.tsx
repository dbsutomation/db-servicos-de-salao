
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Client, TeamMember } from '@/types';

export const useCheckoutForm = () => {
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      clientId: '',
      teamMemberId: '',
      paymentMethod: 'money',
      tipAmount: ''
    }
  });

  useEffect(() => {
    fetchClients();
    fetchTeamMembers();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('has_access', true)
        .order('name');

      if (error) throw error;

      const teamMembers: TeamMember[] = data.map(professional => ({
        id: professional.id,
        name: professional.name,
        email: professional.email,
        phone: professional.phone || '',
        profession: professional.profession || '',
        password: '',
        hasAccess: professional.has_access,
        isManager: professional.is_manager,
        avatar: professional.avatar || '',
        categories: professional.categories || []
      }));

      setTeamMembers(teamMembers);
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
    }
  };

  const onSubmit = async (data: any) => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const selectedTeamMember = teamMembers.find(member => member.id === data.teamMemberId);
      
      if (!selectedTeamMember) {
        throw new Error("Profissional não encontrado");
      }

      for (const item of cartItems) {
        const commissionPercentage = item.service.commission / 100;
        const commissionAmount = item.service.price * commissionPercentage;
        const tipAmount = parseFloat(data.tipAmount) || 0;

        const { error } = await supabase
          .from('service_records')
          .insert({
            service_id: item.service.id,
            client_id: data.clientId,
            professional_id: data.teamMemberId,
            service_value: item.service.price,
            commission_amount: commissionAmount,
            payment_method: data.paymentMethod,
            tip_amount: tipAmount,
            date: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Registro finalizado com sucesso!",
      });

      clearCart();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao finalizar registro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = `
      COMPROVANTE DE REGISTRO
      
      Data: ${new Date().toLocaleDateString('pt-BR')}
      
      Itens:
      ${cartItems.map(item => `- ${item.service.name}: R$ ${item.service.price.toFixed(2)}`).join('\n')}
      
      Total: R$ ${getCartTotal().toFixed(2)}
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre>${printContent}</pre>`);
      printWindow.print();
      printWindow.close();
    }
  };

  return {
    form,
    clients,
    teamMembers,
    loading,
    onSubmit,
    handlePrint
  };
};

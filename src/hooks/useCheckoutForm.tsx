
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
    const formData = form.getValues();
    const selectedClient = clients.find(client => client.id === formData.clientId);
    const selectedTeamMember = teamMembers.find(member => member.id === formData.teamMemberId);
    
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprovante de Serviço</title>
        <style>
          @media print {
            body {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.4;
              color: #000 !important;
              background: white !important;
              margin: 10px;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 15px;
              background: white !important;
            }
            
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 15px;
              text-transform: uppercase;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            
            .info-line {
              margin: 8px 0;
              font-weight: bold;
              color: #000 !important;
            }
            
            .separator {
              border-top: 1px dashed #000;
              margin: 12px 0;
              height: 1px;
            }
            
            .item {
              margin: 6px 0;
              display: flex;
              justify-content: space-between;
              font-weight: bold;
            }
            
            .total {
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 15px;
              font-size: 16px;
              font-weight: bold;
              text-align: right;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              font-style: italic;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            COMPROVANTE DE SERVIÇO
          </div>
          
          <div class="info-line">
            <strong>Data:</strong> ${formattedDate}
          </div>
          
          <div class="info-line">
            <strong>Hora:</strong> ${formattedTime}
          </div>
          
          <div class="info-line">
            <strong>Cliente:</strong> ${selectedClient ? selectedClient.name : 'Não selecionado'}
          </div>
          
          <div class="info-line">
            <strong>Profissional:</strong> ${selectedTeamMember ? selectedTeamMember.name : 'Não selecionado'}
          </div>
          
          <div class="info-line">
            <strong>Forma de Pagamento:</strong> ${formData.paymentMethod === 'money' ? 'Dinheiro' : 
              formData.paymentMethod === 'credit' ? 'Cartão de Crédito' :
              formData.paymentMethod === 'debit' ? 'Cartão de Débito' :
              formData.paymentMethod === 'pix' ? 'PIX' : 'Transferência'}
          </div>
          
          <div class="separator"></div>
          
          <div style="font-weight: bold; margin-bottom: 10px;">SERVIÇOS:</div>
          
          ${cartItems.map(item => `
            <div class="item">
              <span>${item.service.name}</span>
              <span>R$ ${item.service.price.toFixed(2)}</span>
            </div>
          `).join('')}
          
          <div class="separator"></div>
          
          <div class="item">
            <span>SUBTOTAL:</span>
            <span>R$ ${getCartTotal().toFixed(2)}</span>
          </div>
          
          ${formData.tipAmount && parseFloat(formData.tipAmount) > 0 ? `
            <div class="item">
              <span>GORJETA:</span>
              <span>R$ ${parseFloat(formData.tipAmount).toFixed(2)}</span>
            </div>
          ` : ''}
          
          <div class="total">
            TOTAL: R$ ${(getCartTotal() + (parseFloat(formData.tipAmount) || 0)).toFixed(2)}
          </div>
          
          <div class="footer">
            Obrigado pela preferência!<br>
            Volte sempre!
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguarda o carregamento completo antes de imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
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

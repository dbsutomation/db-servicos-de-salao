
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

  // Handle printing functionality
  const handlePrint = () => {
    const formValues = form.getValues();
    
    if (!formValues.client || !formValues.teamMember) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o cliente e o profissional antes de imprimir",
        variant: "destructive",
      });
      return;
    }

    // Get the selected client
    const client = clients.find(c => c.id === formValues.client);
    
    // Prepare receipt data
    const receiptData = {
      client: client?.name || 'Cliente não selecionado',
      items: cartItems.map(item => ({
        name: item.service.name,
        price: item.service.price,
        quantity: item.quantity,
        tipAmount: item.tipAmount || 0
      })),
      subtotal: getCartTotal(),
      totalTips: getCartTipsTotal(),
      total: getCartTotal() + getCartTipsTotal(),
      paymentMethod: paymentMethodLabels[formValues.paymentMethod],
      creditPaymentType: formValues.paymentMethod === 'credit' 
        ? (formValues.creditPaymentType === 'full' ? 'À Vista' : 'Parcelado')
        : undefined,
      date: new Date().toLocaleDateString('pt-BR')
    };

    // Print receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante - GoldenSky JP56H</title>
            <style>
              body {
                font-family: monospace;
                padding: 20px;
                width: 300px;
                margin: 0 auto;
              }
              h2 {
                text-align: center;
                margin-bottom: 10px;
              }
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .total {
                font-weight: bold;
                text-align: right;
                margin-top: 10px;
              }
              .info {
                margin-bottom: 5px;
              }
            </style>
          </head>
          <body>
            <h2>Comprovante para Conferência</h2>
            <div class="info">Cliente: ${receiptData.client}</div>
            <div class="info">Data: ${receiptData.date}</div>
            <div class="divider"></div>
            ${receiptData.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              ${item.tipAmount > 0 ? `
              <div class="item" style="padding-left: 10px; color: #666;">
                <span>Gorjeta</span>
                <span>R$ ${item.tipAmount.toFixed(2)}</span>
              </div>
              ` : ''}
            `).join('')}
            <div class="divider"></div>
            <div class="item">
              <span>Subtotal:</span>
              <span>R$ ${receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Total Gorjetas:</span>
              <span>R$ ${receiptData.totalTips.toFixed(2)}</span>
            </div>
            <div class="total">
              <span>TOTAL: R$ ${receiptData.total.toFixed(2)}</span>
            </div>
            <div class="divider"></div>
            <div class="info">Forma de pagamento: ${receiptData.paymentMethod}</div>
            ${receiptData.creditPaymentType ? `<div class="info">Tipo: ${receiptData.creditPaymentType}</div>` : ''}
            <div class="divider"></div>
            <div style="text-align: center; margin-top: 20px;">
              Obrigado pela preferência!
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Trigger print
      printWindow.print();
      // Close after printing
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão",
        variant: "destructive",
      });
    }
  };

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
      // Prepare payment method string
      let paymentMethodString = paymentMethodLabels[values.paymentMethod];
      
      // Add credit payment type if applicable
      if (values.paymentMethod === 'credit' && values.creditPaymentType) {
        paymentMethodString += ` - ${values.creditPaymentType === 'full' ? 'À Vista' : 'Parcelado'}`;
      }

      // Process each cart item
      for (const item of cartItems) {
        const { error } = await supabase
          .from('service_records')
          .insert({
            client_id: client.id,
            professional_id: teamMember.id,
            service_id: item.service.id,
            payment_method: paymentMethodString,
            commission_amount: item.service.price * (item.service.commission / 100),
            service_value: item.service.price * item.quantity,
            tip_amount: item.tipAmount || 0
          });

        if (error) throw error;
      }
      
      // Show success message
      toast({
        title: "Serviços registrados",
        description: `${cartItems.reduce((total, item) => total + item.quantity, 0)} serviços registrados com sucesso`,
      });
      
      // Clear the cart
      clearCart();
      
      // Navigate to the services page
      navigate('/services');
    } catch (error: any) {
      toast({
        title: "Erro ao registrar serviços",
        description: error.message || "Ocorreu um erro ao salvar os registros",
        variant: "destructive",
      });
    }
  };

  return { form, clients, teamMembers, loading, onSubmit, handlePrint };
}


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

    // Print receipt with improved layout
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante - GoldenSky JP56H</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
              
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 5px;
                width: 70mm;
                max-width: 70mm;
                color: #000;
                background: #fff;
              }
              
              .header {
                text-align: center;
                margin-bottom: 8px;
                font-weight: bold;
                font-size: 14px;
              }
              
              .info {
                margin-bottom: 3px;
                font-size: 11px;
                word-wrap: break-word;
              }
              
              .item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 2px;
                font-size: 11px;
              }
              
              .item-name {
                flex: 1;
                margin-right: 5px;
                word-wrap: break-word;
                overflow: hidden;
              }
              
              .item-price {
                white-space: nowrap;
                text-align: right;
                min-width: 40px;
              }
              
              .tip {
                padding-left: 10px;
                color: #666;
                font-size: 10px;
              }
              
              .divider {
                border-top: 1px dashed #000;
                margin: 5px 0;
              }
              
              .total-line {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 11px;
              }
              
              .total-final {
                font-weight: bold;
                font-size: 13px;
                border-top: 2px solid #000;
                padding-top: 3px;
                margin-top: 5px;
              }
              
              .footer {
                text-align: center;
                margin-top: 10px;
                font-size: 11px;
              }
              
              .payment-info {
                margin-top: 5px;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="header">Comprovante</div>
            
            <div class="info">Cliente: ${receiptData.client}</div>
            <div class="info">Data: ${receiptData.date}</div>
            
            <div class="divider"></div>
            
            ${receiptData.items.map(item => `
              <div class="item">
                <span class="item-name">${item.quantity}x ${item.name}</span>
                <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              ${item.tipAmount > 0 ? `
              <div class="item tip">
                <span class="item-name">Gorjeta</span>
                <span class="item-price">R$ ${item.tipAmount.toFixed(2)}</span>
              </div>
              ` : ''}
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="total-line">
              <span>Subtotal:</span>
              <span>R$ ${receiptData.subtotal.toFixed(2)}</span>
            </div>
            
            <div class="total-line">
              <span>Gorjetas:</span>
              <span>R$ ${receiptData.totalTips.toFixed(2)}</span>
            </div>
            
            <div class="total-line total-final">
              <span>TOTAL:</span>
              <span>R$ ${receiptData.total.toFixed(2)}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="payment-info">
              <div class="info">Pagamento: ${receiptData.paymentMethod}</div>
              ${receiptData.creditPaymentType ? `<div class="info">${receiptData.creditPaymentType}</div>` : ''}
            </div>
            
            <div class="footer">
              Obrigado pela preferencia!
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Handle print dialog and cleanup
      const handleAfterPrint = () => {
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
          }
          toast({
            title: "Impressão concluída",
            description: "Comprovante processado com sucesso",
          });
        }, 100);
      };
      
      const handleBeforePrint = () => {
        console.log('Iniciando impressão...');
      };
      
      // Set up event listeners
      printWindow.onbeforeprint = handleBeforePrint;
      printWindow.onafterprint = handleAfterPrint;
      
      // For browsers that don't support onafterprint
      if (typeof printWindow.onafterprint === 'undefined') {
        printWindow.onbeforeunload = handleAfterPrint;
      }
      
      // Trigger print automatically
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      // Fallback: close window after 5 seconds if still open
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
          toast({
            title: "Janela de impressão fechada",
            description: "A janela foi fechada automaticamente",
          });
        }
      }, 5000);
      
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

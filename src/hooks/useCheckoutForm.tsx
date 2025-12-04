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

    // Print receipt with improved layout for 70mm thermal printers
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprovante - GoldenSky JP56H</title>
            <style>
              @page {
                size: 70mm auto;
                margin: 1mm;
              }
              
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                font-weight: 900;
                line-height: 1.0;
                margin: 0;
                padding: 1mm;
                width: 68mm;
                max-width: 68mm;
                color: #000;
                background: #fff;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .header {
                text-align: center;
                margin-bottom: 4px;
                font-weight: 900;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .info {
                margin-bottom: 2px;
                font-size: 11px;
                font-weight: 900;
                word-wrap: break-word;
                overflow-wrap: break-word;
                line-height: 1.1;
              }
              
              .item {
                display: block;
                margin-bottom: 1px;
                font-size: 10px;
                font-weight: 900;
                word-wrap: break-word;
                overflow-wrap: break-word;
                line-height: 1.1;
              }
              
              .item-line {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1px;
                width: 100%;
              }
              
              .item-name {
                flex: 1;
                margin-right: 3px;
                font-weight: 900;
                max-width: 45mm;
                word-wrap: break-word;
                overflow-wrap: break-word;
                font-size: 10px;
              }
              
              .item-price {
                white-space: nowrap;
                text-align: right;
                min-width: 15mm;
                font-weight: 900;
                font-size: 10px;
                flex-shrink: 0;
              }
              
              .tip {
                padding-left: 6px;
                color: #333;
                font-size: 9px;
                font-weight: 900;
                margin-top: 1px;
              }
              
              .divider {
                border-top: 2px solid #000;
                margin: 3px 0;
                height: 1px;
                width: 100%;
              }
              
              .total-line {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 1px 0;
                font-size: 11px;
                font-weight: 900;
                width: 100%;
              }
              
              .total-label {
                flex: 1;
                font-weight: 900;
                font-size: 11px;
              }
              
              .total-value {
                white-space: nowrap;
                text-align: right;
                min-width: 18mm;
                font-weight: 900;
                font-size: 11px;
                flex-shrink: 0;
              }
              
              .total-final {
                font-weight: 900;
                font-size: 12px;
                border-top: 2px double #000;
                border-bottom: 2px double #000;
                padding: 2px 0;
                margin: 3px 0;
                text-transform: uppercase;
              }
              
              .footer {
                text-align: center;
                margin-top: 6px;
                font-size: 10px;
                font-weight: 900;
              }
              
              .payment-info {
                margin-top: 3px;
                font-size: 10px;
                font-weight: 900;
              }
              
              .center {
                text-align: center;
              }
              
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-weight: 900 !important;
                }
                
                * {
                  font-weight: 900 !important;
                }
                
                .item-price, .total-value {
                  font-weight: 900 !important;
                  color: #000 !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">COMPROVANTE</div>
            
            <div class="info">Cliente: ${receiptData.client}</div>
            <div class="info">Data: ${receiptData.date}</div>
            
            <div class="divider"></div>
            
            ${receiptData.items.map(item => `
              <div class="item">
                <div class="item-line">
                  <span class="item-name">${item.quantity}x ${item.name}</span>
                  <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
                ${item.tipAmount > 0 ? `
                <div class="tip">
                  <div class="item-line">
                    <span class="item-name">+ Gorjeta</span>
                    <span class="item-price">R$ ${item.tipAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                ` : ''}
              </div>
            `).join('')}
            
            <div class="divider"></div>
            
            <div class="total-line">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">R$ ${receiptData.subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            
            ${receiptData.totalTips > 0 ? `
            <div class="total-line">
              <span class="total-label">Gorjetas:</span>
              <span class="total-value">R$ ${receiptData.totalTips.toFixed(2).replace('.', ',')}</span>
            </div>
            ` : ''}
            
            <div class="total-line total-final">
              <span class="total-label">TOTAL:</span>
              <span class="total-value">R$ ${receiptData.total.toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="payment-info">
              <div class="info center">Pagamento: ${receiptData.paymentMethod}</div>
              ${receiptData.creditPaymentType ? `<div class="info center">${receiptData.creditPaymentType}</div>` : ''}
            </div>
            
            <div class="footer">
              OBRIGADO PELA PREFERENCIA!
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
    console.log('=== INÍCIO DO CHECKOUT ===');
    console.log('Valores do formulário:', values);
    console.log('Itens no carrinho:', cartItems);
    
    const clientId = values.client;
    const teamMemberId = values.teamMember;
    
    const client = clients.find(c => c.id === clientId);
    const teamMember = teamMembers.find(t => t.id === teamMemberId);
    
    console.log('Cliente selecionado:', client);
    console.log('Profissional selecionado:', teamMember);
    
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

      // Process each cart item
      console.log('Processando itens do carrinho...');
      for (const item of cartItems) {
        const recordData = {
          client_id: client.id,
          professional_id: teamMember.id,
          service_id: item.service.id,
          payment_method: paymentMethodString,
          commission_amount: item.service.price * (item.service.commission / 100),
          service_value: item.service.price * item.quantity,
          tip_amount: item.tipAmount || 0
        };
        
        console.log('Inserindo registro:', recordData);
        
        const { data, error } = await supabase
          .from('service_records')
          .insert(recordData)
          .select();

        if (error) {
          console.error('Erro ao inserir registro:', error);
          throw error;
        }
        
        console.log('Registro inserido com sucesso:', data);
      }
      
      console.log('Todos os registros inseridos com sucesso!');
      
      // Show success message
      toast({
        title: "Serviços registrados",
        description: `${cartItems.reduce((total, item) => total + item.quantity, 0)} serviços registrados com sucesso`,
      });
      
      // Clear the cart
      clearCart();
      
      // Navigate to the home page
      navigate('/');
      
      console.log('=== FIM DO CHECKOUT ===');
    } catch (error: any) {
      console.error('Erro ao registrar serviços:', error);
      toast({
        title: "Erro ao registrar serviços",
        description: error.message || "Ocorreu um erro ao salvar os registros",
        variant: "destructive",
      });
    }
  };

  return { form, clients, teamMembers, loading, onSubmit, handlePrint };
}

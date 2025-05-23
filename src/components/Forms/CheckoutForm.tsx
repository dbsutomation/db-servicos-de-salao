
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import ClientSelect from './CheckoutComponents/ClientSelect';
import TeamMemberSelect from './CheckoutComponents/TeamMemberSelect';
import PaymentMethodSelector from './CheckoutComponents/PaymentMethodSelector';

interface CheckoutFormProps {
  onSuccess?: () => void;
}

const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const { form, clients, teamMembers, loading, onSubmit, handlePrint } = useCheckoutForm();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ClientSelect 
          form={form} 
          clients={clients} 
          loading={loading} 
        />
        
        <TeamMemberSelect 
          form={form} 
          teamMembers={teamMembers} 
          loading={loading} 
        />

        <PaymentMethodSelector form={form} />
        
        <div className="flex gap-4 mt-6">
          <Button 
            type="button" 
            variant="outline"
            className="flex gap-2"
            onClick={handlePrint}
            disabled={loading}
          >
            <Printer size={18} />
            Imprimir para conferência
          </Button>
          
          <Button 
            type="submit" 
            className="flex-1 bg-salon-purple hover:bg-salon-dark-purple" 
            disabled={loading}
          >
            Finalizar Registro
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CheckoutForm;

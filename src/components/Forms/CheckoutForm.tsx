
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import ClientSelect from './CheckoutComponents/ClientSelect';
import TeamMemberSelect from './CheckoutComponents/TeamMemberSelect';
import PaymentMethodSelector from './CheckoutComponents/PaymentMethodSelector';

interface CheckoutFormProps {
  onSuccess?: () => void;
}

const CheckoutForm = ({ onSuccess }: CheckoutFormProps) => {
  const { form, clients, teamMembers, loading, onSubmit } = useCheckoutForm();
  
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
        
        <Button 
          type="submit" 
          className="w-full bg-salon-purple hover:bg-salon-dark-purple" 
          disabled={loading}
        >
          Finalizar Registro
        </Button>
      </form>
    </Form>
  );
};

export default CheckoutForm;

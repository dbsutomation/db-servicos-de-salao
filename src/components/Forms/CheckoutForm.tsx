
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import ClientSelect from './CheckoutComponents/ClientSelect';
import TeamMemberSelect from './CheckoutComponents/TeamMemberSelect';
import PaymentMethodSelector from './CheckoutComponents/PaymentMethodSelector';
import QuickClientCreate from './CheckoutComponents/QuickClientCreate';

const CheckoutForm = () => {
  const { form, clients, teamMembers, loading, onSubmit, onClientCreated } = useCheckoutForm();
  
  return (
    <Form {...form}>
      <div className="space-y-6">
      <div className="space-y-2">
        <ClientSelect 
          form={form} 
          clients={clients} 
          loading={loading} 
        />
        <QuickClientCreate disabled={loading} onCreated={onClientCreated} />
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <TeamMemberSelect 
          form={form} 
          teamMembers={teamMembers} 
          loading={loading} 
        />

        <PaymentMethodSelector form={form} />
        
        <Button type="submit" className="w-full h-12 text-base mt-6" disabled={loading}>
          Finalizar Registro
        </Button>
      </form>
      </div>
    </Form>
  );
};

export default CheckoutForm;

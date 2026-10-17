
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
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ClientSelect 
          form={form} 
          clients={clients} 
          loading={loading} 
        />
        <Button type="button" variant="link" className="hidden" aria-hidden="true" tabIndex={-1} />
        
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
    </Form>
    <div className="mt-3">
      <QuickClientCreate disabled={loading} onCreated={onClientCreated} />
    </div>
    </>
  );
};

export default CheckoutForm;

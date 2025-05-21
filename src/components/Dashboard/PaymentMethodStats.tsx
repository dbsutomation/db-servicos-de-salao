
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentMethodStat {
  method: string;
  amount: number;
}

interface PaymentMethodStatsProps {
  paymentMethodStats: PaymentMethodStat[];
}

const PaymentMethodStats: React.FC<PaymentMethodStatsProps> = ({ paymentMethodStats }) => {
  // Calculate credit payment totals
  const creditFullPayment = paymentMethodStats
    .filter(stat => stat.method.includes('Cartão de Crédito') && stat.method.includes('À Vista'))
    .reduce((total, stat) => total + stat.amount, 0);

  const creditInstallmentPayment = paymentMethodStats
    .filter(stat => stat.method.includes('Cartão de Crédito') && stat.method.includes('Parcelado'))
    .reduce((total, stat) => total + stat.amount, 0);

  return (
    <>
      <h2 className="text-xl font-semibold">Pagamentos por Método</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Regular payment methods */}
        {paymentMethodStats
          .filter(stat => !stat.method.includes('Cartão de Crédito'))
          .map(({method, amount}) => (
            <Card key={method} className="shadow-md border-2 border-gray-100">
              <CardHeader>
                <CardDescription>Pagamentos em {method}</CardDescription>
                <CardTitle className="text-2xl">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency', 
                    currency: 'BRL'
                  }).format(amount)}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}

        {/* Credit Card Payment - Consolidated Card */}
        {paymentMethodStats.some(stat => stat.method.includes('Cartão de Crédito')) && (
          <Card className="shadow-md border-2 border-gray-100">
            <CardHeader>
              <CardDescription>Pagamentos em Cartão de Crédito</CardDescription>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency', 
                  currency: 'BRL'
                }).format(creditFullPayment + creditInstallmentPayment)}
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Credit Card Payment Details - Separate cards for payment types */}
      {(creditFullPayment > 0 || creditInstallmentPayment > 0) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md border-2 border-gray-100 bg-blue-50">
            <CardHeader>
              <CardDescription>Crédito À Vista</CardDescription>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency', 
                  currency: 'BRL'
                }).format(creditFullPayment)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-md border-2 border-gray-100 bg-blue-50">
            <CardHeader>
              <CardDescription>Crédito Parcelado</CardDescription>
              <CardTitle className="text-2xl">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency', 
                  currency: 'BRL'
                }).format(creditInstallmentPayment)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {paymentMethodStats.length === 0 && (
        <Card className="col-span-full shadow-md border-2 border-gray-100">
          <CardHeader>
            <CardDescription>Nenhum pagamento registrado no período</CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
};

export default PaymentMethodStats;

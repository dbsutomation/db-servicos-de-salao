
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
  return (
    <>
      <h2 className="text-xl font-semibold">Pagamentos por Método</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {paymentMethodStats.map(({method, amount}) => (
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
        {paymentMethodStats.length === 0 && (
          <Card className="col-span-full shadow-md border-2 border-gray-100">
            <CardHeader>
              <CardDescription>Nenhum pagamento registrado no período</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
};

export default PaymentMethodStats;

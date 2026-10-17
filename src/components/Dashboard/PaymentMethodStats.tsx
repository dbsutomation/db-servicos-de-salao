import React from 'react';
import { Banknote, CreditCard, QrCode, Wallet } from 'lucide-react';
import StatCard from './StatCard';

interface PaymentMethodStat { method: string; amount: number; }
interface PaymentMethodStatsProps { paymentMethodStats: PaymentMethodStat[]; }

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const iconFor = (method: string) => {
  const m = method.toLowerCase();
  if (m.includes('pix')) return <QrCode size={20} />;
  if (m.includes('cart') || m.includes('créd') || m.includes('déb')) return <CreditCard size={20} />;
  if (m.includes('dinheiro')) return <Banknote size={20} />;
  return <Wallet size={20} />;
};

const PaymentMethodStats: React.FC<PaymentMethodStatsProps> = ({ paymentMethodStats }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-semibold">Pagamentos por Método</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {paymentMethodStats.map(({ method, amount }) => (
        <StatCard key={method} label={`Pagamentos em ${method}`} value={brl(amount)} icon={iconFor(method)} />
      ))}
      {paymentMethodStats.length === 0 && (
        <p className="col-span-full rounded-xl border p-4 text-sm text-muted-foreground">Nenhum pagamento registrado no período</p>
      )}
    </div>
  </section>
);

export default PaymentMethodStats;

import { BarChart3, Building2, ChevronDown, Coins, CreditCard, Banknote, Home, QrCode, Scissors, Settings, ShoppingCart, Star, User, Users } from 'lucide-react';

const menu = [
  { icon: Home, label: 'Início', active: true },
  { icon: Scissors, label: 'Serviços e Produtos' },
  { icon: Users, label: 'Clientes' },
  { icon: User, label: 'Profissionais' },
  { icon: ShoppingCart, label: 'Carrinho' },
  { icon: Settings, label: 'Configurações' },
];

const Mini = ({ label, icon: Icon }: { label: string; icon: typeof Home }) => (
  <div className="flex items-center justify-between rounded-lg border bg-card p-2">
    <div className="min-w-0">
      <p className="text-[9px] text-muted-foreground truncate">{label}</p>
      <p className="text-xs font-bold">R$ --,--</p>
    </div>
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-primary"><Icon size={12} /></span>
  </div>
);

/** Ilustração do produto com dados mascarados — sem dados reais. */
const DashboardTeaser = () => (
  <div aria-hidden="true" className="pointer-events-none select-none flex rounded-2xl border bg-card shadow-xl overflow-hidden text-foreground">
    <aside className="hidden lg:flex w-40 shrink-0 flex-col gap-1 border-r p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground"><Building2 size={16} /></span>
        <div><p className="text-xs font-semibold">Seu salão</p><p className="text-[9px] text-muted-foreground">Painel de Gestão</p></div>
      </div>
      {menu.map(({ icon: Icon, label, active }) => (
        <div key={label} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${active ? 'bg-accent text-primary font-medium' : ''}`}>
          <Icon size={13} />{label}
        </div>
      ))}
    </aside>
    <div className="flex-1 min-w-0 space-y-2.5 p-3">
      <p className="text-sm font-bold">Dashboard</p>
      <div className="flex gap-2">
        {['Período', 'Todos os profissionais', 'Todos os tipos'].map(f => (
          <span key={f} className="flex items-center gap-2 rounded-md border px-2 py-1 text-[9px]">{f}<ChevronDown size={10} /></span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-lg bg-accent p-2.5">
          <div><p className="text-[10px] text-muted-foreground">Faturamento Total</p><p className="text-base font-bold">R$ --,--</p></div>
          <BarChart3 size={16} className="text-primary" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-2.5">
          <div><p className="text-[10px] text-muted-foreground">Comissão Total</p><p className="text-base font-bold">R$ --,--</p></div>
          <Coins size={16} className="text-destructive" />
        </div>
      </div>
      <div className="rounded-lg border p-2.5">
        <p className="text-[11px] font-semibold">Evolução do Faturamento</p>
        <svg viewBox="0 0 300 70" className="mt-1 h-16 w-full">
          <defs>
            <linearGradient id="teaserFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M5 20 C40 30,60 35,65 32 S110 12,125 13 S170 25,185 24 S235 10,245 12 S280 30,295 40 L295 70 L5 70 Z" fill="url(#teaserFill)" />
          <path d="M5 20 C40 30,60 35,65 32 S110 12,125 13 S170 25,185 24 S235 10,245 12 S280 30,295 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        </svg>
      </div>
      <p className="text-[11px] font-semibold">Pagamentos por Método</p>
      <div className="grid grid-cols-4 gap-2">
        <Mini label="PIX" icon={QrCode} /><Mini label="Crédito" icon={CreditCard} /><Mini label="Débito" icon={CreditCard} /><Mini label="Dinheiro" icon={Banknote} />
      </div>
      <p className="text-[11px] font-semibold">Indicadores de Quantidade</p>
      <div className="grid grid-cols-4 gap-2">
        {[['Serviços', Scissors], ['Clientes', Users], ['Mais realizado', Star], ['Mais frequente', Star]].map(([l, I]) => (
          <div key={l as string} className="flex items-center justify-between rounded-lg border bg-card p-2">
            <div><p className="text-[9px] text-muted-foreground">{l as string}</p><p className="text-xs font-bold">--</p></div>
            {(() => { const Icon = I as typeof Home; return <Icon size={12} className="text-primary" />; })()}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardTeaser;

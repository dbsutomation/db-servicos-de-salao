import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarPlus, CalendarDays, LogOut, Menu, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const NAV_ITEMS = [
  {
    path: '/minha-agenda',
    label: 'Agendar',
    icon: <CalendarPlus size={20} />,
  },
  {
    path: '/meus-agendamentos',
    label: 'Meus agendamentos',
    icon: <CalendarDays size={20} />,
  },
];

function SidebarContent({ onLogout, onNavigate, onNavigateTo, salonName, clientName }: { onLogout: () => void; onNavigate?: () => void; onNavigateTo: (path: string) => void; salonName: string; clientName: string }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 border-b-2 border-gray-100">
        <h1 className="font-bold text-salon-purple text-xl">{salonName || 'Meu Salão'}</h1>
        <p className="text-xs text-muted-foreground mt-1">Portal do cliente</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                onNavigate?.();
                onNavigateTo(item.path);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors border-2',
                active
                  ? 'bg-salon-purple/10 text-salon-purple border-salon-purple/20 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-200'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        <Button
          variant="ghost"
          className="flex w-full items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100 justify-start border-2 border-transparent hover:border-gray-200 mt-4"
          onClick={onLogout}
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </Button>
      </nav>

      {clientName && (
        <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-salon-purple/20 flex items-center justify-center shrink-0">
              <span className="text-salon-purple font-semibold text-sm">
                {clientName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{clientName}</span>
              <span className="text-xs text-gray-500">Cliente</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [salonName, setSalonName] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase
        .from('customers')
        .select('salon_id, name')
        .eq('id', user.id)
        .maybeSingle();
      const sId = (customer as any)?.salon_id;
      setClientName((customer as any)?.name || '');
      if (!sId) return;
      const { data: salon } = await supabase
        .from('salons' as any)
        .select('name')
        .eq('id', sId)
        .maybeSingle();
      setSalonName((salon as any)?.name || '');
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login-cliente');
    toast({ title: 'Você saiu da sua conta.' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-gray-200 shadow-md hidden md:block">
        <SidebarContent onLogout={handleLogout} onNavigateTo={navigate} salonName={salonName} clientName={clientName} />
      </aside>

      {/* Header mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b-2 border-gray-200 shadow-sm flex items-center px-4 justify-between md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </Button>
        <div className="flex flex-col items-center min-w-0 px-2">
          <span className="font-bold text-salon-purple text-sm truncate max-w-[200px] leading-tight">
            {salonName || 'Meu Salão'}
          </span>
          {clientName && (
            <span className="text-xs text-gray-500 truncate max-w-[200px] leading-tight">
              {clientName}
            </span>
          )}
        </div>
        {/* Avatar do cliente */}
        {clientName ? (
          <div className="h-8 w-8 rounded-full bg-salon-purple/20 flex items-center justify-center shrink-0">
            <span className="text-salon-purple font-semibold text-sm">
              {clientName.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-100">
              <span className="font-bold text-salon-purple text-base truncate">
                {salonName || 'Meu Salão'}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} onNavigateTo={navigate} salonName="" clientName={clientName} />
            </div>
          </aside>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-64 mt-16 md:mt-0 min-w-0 overflow-x-hidden">
        <div className="p-3 md:p-8">
          <div className="bg-white rounded-lg shadow-md border-2 border-gray-100 p-4 md:p-6 w-full max-w-2xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

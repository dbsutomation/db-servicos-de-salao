import { useState } from 'react';
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

function SidebarContent({ onLogout, onNavigate }: { onLogout: () => void; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 border-b-2 border-gray-100">
        <h1 className="font-bold text-salon-purple text-xl">Meu Sal\u00e3o</h1>
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
                window.location.href = item.path;
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
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login-cliente');
    toast({ title: 'Voc\u00ea saiu da sua conta.' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-gray-200 shadow-md hidden md:block">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Header mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b-2 border-gray-200 shadow-sm flex items-center px-4 justify-between md:hidden">
        <h1 className="font-bold text-salon-purple text-lg">Meu Sal\u00e3o</h1>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </Button>
      </header>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="flex justify-end p-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </Button>
            </div>
            <SidebarContent onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 md:ml-64 mt-16 md:mt-0 p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-100 p-6 max-w-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

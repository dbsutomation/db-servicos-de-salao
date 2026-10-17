
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Scissors, Users, User, ShoppingBag, Calendar, Receipt, Clock, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';
import { MainLayoutProps, NavItem } from './types';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

const MainLayout = ({ children }: MainLayoutProps) => {
  const { currentUser, logout, checkAccess } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'Início',
      icon: <Home size={20} />,
      requiredRoles: ['/']
    },
    {
      path: '/services',
      label: 'Serviços e Produtos',
      icon: <Scissors size={20} />,
      requiredRoles: ['/services']
    },
    {
      path: '/clients',
      label: 'Clientes',
      icon: <Users size={20} />,
      requiredRoles: ['/clients']
    },
    {
      path: '/team',
      label: 'Profissionais',
      icon: <User size={20} />,
      requiredRoles: ['/team']
    },
    {
      path: '/cart',
      label: 'Carrinho',
      icon: <ShoppingBag size={20} />,
      requiredRoles: ['/cart']
    },
    {
      path: '/expenses',
      label: 'Despesas',
      icon: <Receipt size={20} />,
      requiredRoles: ['/expenses']
    },
    {
      path: '/agenda',
      label: 'Agenda',
      icon: <Calendar size={20} />,
      requiredRoles: ['/agenda']
    },
    {
      path: '/configurar-horarios',
      label: 'Horários de trabalho',
      icon: <Clock size={20} />,
      requiredRoles: ['/configurar-horarios']
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => 
    !item.requiredRoles || checkAccess(item.requiredRoles)
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r-2 border-border shadow-md transition-transform duration-300 ease-in-out ${
          isMobile ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <Sidebar 
          filteredNavItems={filteredNavItems}
          handleLogout={handleLogout}
          currentUser={currentUser}
        />
      </aside>

      {/* Mobile header */}
      {isMobile && (
        <MobileHeader toggleMobileMenu={toggleMobileMenu} />
      )}

      {/* Mobile sidebar (overlay) */}
      <MobileSidebar 
        mobileMenuOpen={mobileMenuOpen && isMobile}
        toggleMobileMenu={toggleMobileMenu}
        filteredNavItems={filteredNavItems}
        handleLogout={handleLogout}
        currentUser={currentUser}
      />

      {isMobile && <BottomNav items={filteredNavItems} onMore={toggleMobileMenu} />}

      {/* Main content */}
      <main className={`flex-1 min-w-0 overflow-x-hidden md:p-8 ${isMobile ? 'pt-14 pb-20' : 'ml-64'} bg-background`}>
        <div className="bg-card md:rounded-lg md:shadow-md md:border-2 border-border p-4 md:p-6 w-full min-w-0 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

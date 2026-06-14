
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Scissors, 
  Users, 
  User, 
  BarChart3, 
  ShoppingBag,
  Calendar,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';
import { MainLayoutProps, NavItem } from './types';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import MobileHeader from './MobileHeader';

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
    }
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r-2 border-gray-200 shadow-md transition-transform duration-300 ease-in-out ${
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

      {/* Main content */}
      <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'mt-16' : 'ml-64'} bg-gray-50`}>
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-100 p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

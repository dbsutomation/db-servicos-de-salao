
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, ShoppingCart, UserPlus } from 'lucide-react';
import SidebarLink from './SidebarLink';
import UserProfile from './UserProfile';
import { NavItem } from './types';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  filteredNavItems: NavItem[];
  handleLogout: () => void;
  currentUser: any;
  isMobile?: boolean;
  toggleMobileMenu?: () => void;
}

const Sidebar = ({ 
  filteredNavItems, 
  handleLogout, 
  currentUser,
  isMobile = false,
  toggleMobileMenu = () => {}
}: SidebarProps) => {
  const { cartItems } = useCart();
  // Calcular o total de itens no carrinho
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Função para renderizar os itens de navegação com badge para o carrinho
  const renderNavItems = () => {
    return filteredNavItems.map((item) => (
      <div key={item.path} className="relative">
        <SidebarLink
          path={item.path}
          label={item.label}
          icon={item.icon}
          onClick={isMobile ? toggleMobileMenu : undefined}
        />
        
        {/* Badge para o carrinho */}
        {item.path === '/cart' && totalItems > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 rounded-full"
          >
            {totalItems}
          </Badge>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 border-b-2 border-gray-100 flex justify-between items-center">
        <h1 className={`font-bold text-salon-purple ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Gestão de Produtos e Serviços
        </h1>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <LogOut size={24} />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {renderNavItems()}
        
        {currentUser?.salonId && (
          <SidebarLink
            path={`/cadastro-cliente/${currentUser.salonId}`}
            label="Cadastro Cliente"
            icon={<UserPlus size={20} />}
            onClick={isMobile ? toggleMobileMenu : undefined}
          />
        )}
        
        <Button
          variant="ghost"
          className="flex w-full items-center px-4 py-3 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100 justify-start border-2 border-transparent hover:border-gray-200 mt-4"
          onClick={handleLogout}
        >
          <LogOut size={20} className="mr-3" />
          <span className="font-medium">Sair</span>
        </Button>
      </nav>
      
      {currentUser && (
        <UserProfile name={currentUser.name} isManager={currentUser.isManager} />
      )}
    </div>
  );
};

export default Sidebar;

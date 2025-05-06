
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Scissors, 
  Users, 
  User, 
  BarChart3, 
  ShoppingBag, 
  Menu as MenuIcon,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiredRoles?: string[];
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { currentUser, logout, checkAccess } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
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
      label: 'Equipe',
      icon: <User size={20} />,
      requiredRoles: ['/team']
    },
    {
      path: '/records',
      label: 'Despesas',
      icon: <BarChart3 size={20} />,
      requiredRoles: ['/records']
    },
    {
      path: '/cart',
      label: 'Carrinho',
      icon: <ShoppingBag size={20} />,
      requiredRoles: ['/cart']
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          isMobile ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold text-salon-purple">
              Gestão do Salão - Arquiteteto Capilar
            </h1>
          </div>

          <nav className="flex-1 px-2 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-salon-purple text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )
                }
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            <Button
              variant="ghost"
              className="flex w-full items-center px-4 py-3 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100 justify-start"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-3" />
              <span>Sair</span>
            </Button>
          </nav>
          
          {currentUser && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  <span className="text-xs text-gray-500">
                    {currentUser.isManager ? 'Gerente' : 'Profissional'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className={`${isMobile ? 'block' : 'hidden'} fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 p-4`}>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <MenuIcon size={24} />
          </Button>
          <h1 className="text-lg font-bold text-salon-purple">
            Gestão do Salão
          </h1>
          
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{currentUser.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile sidebar (overlay) */}
      {mobileMenuOpen && isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleMobileMenu}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out translate-x-0">
            <div className="flex flex-col h-full">
              <div className="px-4 py-6 flex justify-between items-center">
                <h1 className="text-lg font-bold text-salon-purple">
                  Gestão do Salão
                </h1>
                <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                  <MenuIcon size={24} />
                </Button>
              </div>

              <nav className="flex-1 px-2 space-y-1">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-salon-purple text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )
                    }
                    onClick={toggleMobileMenu}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                
                <Button
                  variant="ghost"
                  className="flex w-full items-center px-4 py-3 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100 justify-start"
                  onClick={handleLogout}
                >
                  <LogOut size={20} className="mr-3" />
                  <span>Sair</span>
                </Button>
              </nav>
              
              {currentUser && (
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{currentUser.name}</span>
                      <span className="text-xs text-gray-500">
                        {currentUser.isManager ? 'Gerente' : 'Profissional'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <main className={`flex-1 p-4 md:p-8 ${isMobile ? 'mt-16' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

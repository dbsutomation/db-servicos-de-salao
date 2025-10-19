
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  toggleMobileMenu: () => void;
}

const MobileHeader = ({ toggleMobileMenu }: MobileHeaderProps) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-gray-200 p-4 shadow-md">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
          <MenuIcon size={24} />
        </Button>
        <h1 className="text-lg font-bold text-salon-purple">
          Gestão de Produtos e Serviços
        </h1>
        
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg border-2 border-gray-200">
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
  );
};

export default MobileHeader;

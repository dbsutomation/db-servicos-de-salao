
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
    <div className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-3 h-14 flex items-center shadow-sm">
      <div className="flex w-full items-center justify-between">
        <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Abrir menu">
          <MenuIcon size={24} />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          {currentUser?.salonLogo && (
            <img
              src={currentUser.salonLogo}
              alt={`Logo de ${currentUser.salonName || 'estabelecimento'}`}
              className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
            />
          )}
          <h1 className="text-sm font-bold text-primary truncate max-w-[160px]">
            {currentUser?.salonName || 'Gestão de Produtos e Serviços'}
          </h1>
        </div>
        
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg border-2 border-border">
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

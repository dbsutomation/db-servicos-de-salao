
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import SidebarLink from './SidebarLink';
import UserProfile from './UserProfile';
import { NavItem } from './types';

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
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6 border-b-2 border-gray-100 flex justify-between items-center">
        <h1 className={`font-bold text-salon-purple ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Gestão do Salão - Arquiteteto Capilar
        </h1>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <LogOut size={24} />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {filteredNavItems.map((item) => (
          <SidebarLink
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
            onClick={isMobile ? toggleMobileMenu : undefined}
          />
        ))}
        
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

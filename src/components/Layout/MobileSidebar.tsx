
import React from 'react';
import Sidebar from './Sidebar';

interface MobileSidebarProps {
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  filteredNavItems: any[];
  handleLogout: () => void;
  currentUser: any;
}

const MobileSidebar = ({ 
  mobileMenuOpen,
  toggleMobileMenu,
  filteredNavItems,
  handleLogout,
  currentUser
}: MobileSidebarProps) => {
  if (!mobileMenuOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={toggleMobileMenu}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out translate-x-0 border-r-2 border-gray-200">
        <Sidebar
          filteredNavItems={filteredNavItems}
          handleLogout={handleLogout}
          currentUser={currentUser}
          isMobile={true}
          toggleMobileMenu={toggleMobileMenu}
        />
      </aside>
    </>
  );
};

export default MobileSidebar;

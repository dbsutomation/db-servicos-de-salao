
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const SidebarLink = ({ path, label, icon, onClick }: SidebarLinkProps) => {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          "flex items-center px-4 py-3 text-sm rounded-md transition-colors border-2",
          isActive
            ? "bg-salon-purple text-white border-salon-purple shadow-md"
            : "text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-200"
        )
      }
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export default SidebarLink;

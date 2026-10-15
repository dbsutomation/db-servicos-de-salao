
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
            ? "bg-accent text-accent-foreground border-transparent"
            : "text-foreground hover:bg-muted border-transparent hover:border-border"
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

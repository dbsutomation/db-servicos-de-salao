import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { NavItem } from './types';
import { useCart } from '@/contexts/CartContext';

interface BottomNavProps {
  items: NavItem[];
  onMore: () => void;
}

const MAIN_PATHS = ['/', '/services', '/cart', '/clients'];

const BottomNav = ({ items, onMore }: BottomNavProps) => {
  const { cartItems } = useCart();
  const totalItems = cartItems.reduce((t, i) => t + i.quantity, 0);
  const mainItems = MAIN_PATHS.map(p => items.find(i => i.path === p)).filter(Boolean) as NavItem[];

  const itemClass = 'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors';

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border shadow-[0_-2px_10px_hsl(var(--foreground)/0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {mainItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => `${itemClass} ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {item.icon}
            <span className="truncate max-w-full px-1">{item.path === '/services' ? 'Serviços' : item.label}</span>
            {item.path === '/cart' && totalItems > 0 && (
              <span className="absolute top-1 right-1/4 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={onMore} className={`${itemClass} text-muted-foreground`}>
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;

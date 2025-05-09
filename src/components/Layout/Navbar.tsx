
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { cartItems } = useCart();
  
  // Calcular o total de itens no carrinho
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <span className="self-center text-xl font-semibold whitespace-nowrap text-salon-purple">
              Gestão Salão
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative">
            <Button variant="outline" size="icon" className="relative border-none">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0 rounded-full">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
          
          <div className="ml-3 hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium">{currentUser?.name}</span>
            <UserCircle className="h-6 w-6" />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="ml-1"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

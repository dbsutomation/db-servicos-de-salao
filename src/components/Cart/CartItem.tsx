
import React from 'react';
import { CartItem as CartItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { Plus, Minus, Trash } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { service, quantity } = item;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(service.price);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(service.price * quantity);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b py-4">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium">{service.name}</h3>
          <p className="text-sm text-gray-500">{formattedPrice}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(service.id, quantity - 1)}
          >
            <Minus size={16} />
          </Button>
          <span className="w-10 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(service.id, quantity + 1)}
          >
            <Plus size={16} />
          </Button>
        </div>
        <div className="w-24 text-right">
          <p className="font-semibold">{formattedTotal}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(service.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash size={18} />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;


import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Service } from '../types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: number) => void;
  updateQuantity: (serviceId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (service: Service) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.service.id === service.id);
      
      if (existingItem) {
        toast({
          title: 'Serviço atualizado',
          description: `${service.name} quantidade atualizada.`,
          duration: 2000,
        });
        
        return prevItems.map(item => 
          item.service.id === service.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        toast({
          title: 'Serviço adicionado',
          description: `${service.name} adicionado ao carrinho.`,
          duration: 2000,
        });
        
        // Create a new cart item with default values
        const newItem: CartItem = {
          id: Date.now(), // Use timestamp as a simple unique ID
          service,
          client: { id: 0, name: '' }, // This will be set during checkout
          quantity: 1
        };
        
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (serviceId: number) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.service.id === serviceId);
      
      if (itemToRemove) {
        toast({
          title: 'Serviço removido',
          description: `${itemToRemove.service.name} removido do carrinho.`,
          duration: 2000,
        });
      }
      
      return prevItems.filter(item => item.service.id !== serviceId);
    });
  };

  const updateQuantity = (serviceId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.service.id === serviceId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: 'Carrinho limpo',
      description: 'Todos os serviços foram removidos do carrinho.',
      duration: 2000,
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.service.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

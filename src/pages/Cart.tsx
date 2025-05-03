
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/Cart/CartItem';
import { Separator } from '@/components/ui/separator';
import CheckoutForm from '@/components/Forms/CheckoutForm';

const Cart = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const handleCheckoutSuccess = () => {
    navigate('/records');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Carrinho</h1>

        {cartItems.length > 0 ? (
          <>
            <div>
              <div className="flex justify-between mb-4">
                <Button variant="link" className="px-0" onClick={clearCart}>
                  Limpar carrinho
                </Button>
                <Link to="/services">
                  <Button variant="outline">Adicionar mais serviços</Button>
                </Link>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <CartItem key={item.service.id} item={item} />
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(getCartTotal())}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Finalizar Registro</h2>
              <CheckoutForm onSuccess={handleCheckoutSuccess} />
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <h2 className="text-xl font-medium text-gray-500 mb-6">Seu carrinho está vazio</h2>
            <Link to="/services">
              <Button className="bg-salon-purple hover:bg-salon-dark-purple">
                Adicionar serviços
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Cart;

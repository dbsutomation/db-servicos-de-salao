
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/Cart/CartItem';
import { Separator } from '@/components/ui/separator';
import CheckoutForm from '@/components/Forms/CheckoutForm';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types';

const Cart = () => {
  const { cartItems, getCartTotal, getCartTipsTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const prefilledRef = useRef(false);

  // Prefill do carrinho quando vier de um agendamento iniciado na /agenda
  useEffect(() => {
    if (prefilledRef.current) return;
    const raw = sessionStorage.getItem('activeAppointment');
    if (!raw) return;
    try {
      const active = JSON.parse(raw) as { serviceIds: string[] };
      if (!active?.serviceIds?.length) return;
      if (cartItems.length > 0) { prefilledRef.current = true; return; }
      prefilledRef.current = true;
      (async () => {
        const { data } = await supabase
          .from('services')
          .select('id, name, description, price, duration, category, type, image, commission')
          .in('id', active.serviceIds);
        ((data as any[]) ?? []).forEach((s) => addToCart(s as Service));
      })();
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base">Subtotal</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(getCartTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base">Total Gorjetas</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(getCartTipsTotal())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-2xl font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(getCartTotal() + getCartTipsTotal())}
                    </span>
                  </div>
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

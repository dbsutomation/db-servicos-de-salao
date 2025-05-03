
import React from 'react';
import Navbar from './Navbar';
import { CartProvider } from '@/contexts/CartContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          {children}
        </main>
        <footer className="bg-white border-t py-6">
          <div className="container mx-auto text-center text-gray-500">
            <p>© 2025 Beleza Gestão Digital. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
};

export default MainLayout;

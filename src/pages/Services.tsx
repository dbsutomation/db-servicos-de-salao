
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ServiceCard from '@/components/Services/ServiceCard';
import { services } from '@/data/mockData';

const Services = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Serviços</h1>
        <p className="text-gray-500">
          Selecione os serviços para adicionar ao carrinho.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Services;

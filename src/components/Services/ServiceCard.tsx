
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Service } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Plus, Percent } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(service.price);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md h-full flex flex-col">
      <div className="w-full bg-muted overflow-hidden h-40 relative">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <div className="flex flex-col flex-grow">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
          <CardDescription className="text-sm text-gray-500 line-clamp-2">
            {service.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-2 flex-grow">
          <div className="flex flex-col">
            <p className="text-xl font-semibold text-salon-purple">{formattedPrice}</p>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Percent size={14} className="mr-1" />
              <span>Comissão: {service.commission}%</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4">
          <Button 
            onClick={() => addToCart(service)} 
            className="w-full bg-salon-purple hover:bg-salon-dark-purple"
          >
            <Plus size={16} className="mr-2" /> Adicionar
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default ServiceCard;

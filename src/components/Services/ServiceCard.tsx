
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Plus } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart } = useCart();

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(service.price);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-video bg-muted overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{service.name}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-xl font-semibold text-salon-purple">{formattedPrice}</p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => addToCart(service)} 
          className="w-full bg-salon-purple hover:bg-salon-dark-purple"
        >
          <Plus size={16} className="mr-2" /> Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;

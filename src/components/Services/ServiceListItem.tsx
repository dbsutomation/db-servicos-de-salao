import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { Plus, Pencil } from 'lucide-react';

interface ServiceListItemProps {
  service: Service;
  canEdit?: boolean;
  onEdit?: (service: Service) => void;
}

const categoryColors: Record<string, string> = {
  Cabelo: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  'Depilação': 'bg-pink-100 text-pink-800 hover:bg-pink-100',
  Podologia: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  Sobrancelhas: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  Unhas: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
};

const categoryLabels: Record<string, string> = {
  Cabelo: 'Cabelo',
  'Depilação': 'Depilação',
  Podologia: 'Podologia',
  Sobrancelhas: 'Sobrancelhas',
  Unhas: 'Unhas',
};

const ServiceListItem = ({ service, canEdit, onEdit }: ServiceListItemProps) => {
  const { addToCart } = useCart();

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(service.price);

  const categoryClass = service.category ? categoryColors[service.category] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  const categoryLabel = service.category ? categoryLabels[service.category] || service.category : '';

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium truncate">{service.name}</h3>
          {categoryLabel && (
            <Badge variant="secondary" className={categoryClass}>
              {categoryLabel}
            </Badge>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-salon-purple">{formattedPrice}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canEdit && onEdit && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(service)}
            className="h-9 w-9"
          >
            <Pencil className="h-4 w-4 text-salon-purple" />
          </Button>
        )}
        <Button
          onClick={() => addToCart(service)}
          size="sm"
          className="bg-salon-purple hover:bg-salon-dark-purple"
        >
          <Plus size={16} className="mr-1" /> Adicionar
        </Button>
      </div>
    </div>
  );
};

export default ServiceListItem;

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
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      {/* Thumbnail da imagem */}
      {service.image && service.image.startsWith('https://') && (
        <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm leading-snug truncate">{service.name}</h3>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {categoryLabel && (
            <Badge variant="secondary" className={`${categoryClass} text-xs`}>
              {categoryLabel}
            </Badge>
          )}
          <span className="font-semibold text-sm text-salon-purple">{formattedPrice}</span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 shrink-0">
        {canEdit && onEdit && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(service)}
            className="h-8 w-8"
          >
            <Pencil className="h-3.5 w-3.5 text-salon-purple" />
          </Button>
        )}
        <Button
          onClick={() => addToCart(service)}
          size="icon"
          className="h-8 w-8 bg-salon-purple hover:bg-salon-dark-purple shrink-0"
          title="Adicionar ao carrinho"
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ServiceListItem;

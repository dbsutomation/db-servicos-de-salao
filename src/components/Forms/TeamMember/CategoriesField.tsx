
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { TeamMemberFormValues } from './validationSchema';

interface CategoriesFieldProps {
  form: UseFormReturn<TeamMemberFormValues>;
}

const serviceCategories = [
  { value: 'Cabelo', label: 'Cabelo' },
  { value: 'Depilação', label: 'Depilação' },
  { value: 'Podologia', label: 'Podologia' },
  { value: 'Sobrancelhas', label: 'Sobrancelhas' },
  { value: 'Unhas', label: 'Unhas' }
];

const CategoriesField = ({ form }: CategoriesFieldProps) => {
  const currentCategories = form.watch('categories') || [];

  const addCategory = (categoryValue: string) => {
    if (!currentCategories.includes(categoryValue)) {
      const newCategories = [...currentCategories, categoryValue];
      form.setValue('categories', newCategories);
    }
  };

  const removeCategory = (categoryValue: string) => {
    const newCategories = currentCategories.filter(cat => cat !== categoryValue);
    form.setValue('categories', newCategories);
  };

  const availableCategories = serviceCategories.filter(
    cat => !currentCategories.includes(cat.value)
  );

  return (
    <FormField
      control={form.control}
      name="categories"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categorias de Serviços</FormLabel>
          <div className="space-y-3">
            {/* Categorias selecionadas */}
            {currentCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentCategories.map((categoryValue) => {
                  const category = serviceCategories.find(cat => cat.value === categoryValue);
                  return (
                    <Badge key={categoryValue} variant="secondary" className="flex items-center gap-1">
                      {category?.label || categoryValue}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeCategory(categoryValue)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
            
            {/* Seletor para adicionar novas categorias */}
            {availableCategories.length > 0 && (
              <Select onValueChange={addCategory}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CategoriesField;

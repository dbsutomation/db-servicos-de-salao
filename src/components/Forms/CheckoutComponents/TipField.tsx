
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface TipFieldProps {
  form: UseFormReturn<any>;
}

const TipField = ({ form }: TipFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="tipAmount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Gorjeta (R$)</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...field}
              value={field.value || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '0' : e.target.value;
                field.onChange(parseFloat(value));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TipField;

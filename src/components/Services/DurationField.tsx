
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface DurationFieldProps {
  form: UseFormReturn<any>;
}

const DurationField = ({ form }: DurationFieldProps) => {
  const currentDuration = parseInt(form.watch('duration') || '60');

  const incrementDuration = () => {
    const newDuration = currentDuration + 5;
    form.setValue('duration', newDuration.toString());
  };

  const decrementDuration = () => {
    const newDuration = Math.max(5, currentDuration - 5);
    form.setValue('duration', newDuration.toString());
  };

  return (
    <FormField
      control={form.control}
      name="duration"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Duração (minutos)</FormLabel>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={decrementDuration}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <FormControl>
              <Input 
                type="number" 
                step="5" 
                min="5" 
                placeholder="60" 
                {...field}
                className="text-center"
                onChange={(e) => {
                  const value = Math.max(5, parseInt(e.target.value) || 5);
                  field.onChange(value.toString());
                }}
              />
            </FormControl>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={incrementDuration}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </FormItem>
      )}
    />
  );
};

export default DurationField;

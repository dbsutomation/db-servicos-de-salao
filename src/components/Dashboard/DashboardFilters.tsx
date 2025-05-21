
import React from 'react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { teamMembers } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardFiltersProps {
  dateFilter: string;
  setDateFilter: (value: string) => void;
  startDate?: Date;
  setStartDate: (date?: Date) => void;
  endDate?: Date;
  setEndDate: (date?: Date) => void;
  selectedProfessional: string | null;
  setSelectedProfessional: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  dateFilter,
  setDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedProfessional,
  setSelectedProfessional,
  selectedType,
  setSelectedType
}) => {
  const { currentUser } = useAuth();
  const form = useForm({
    defaultValues: {
      professional: selectedProfessional || "all",
      type: selectedType
    }
  });

  const onProfessionalChange = (value: string) => {
    setSelectedProfessional(value);
    form.setValue("professional", value);
  };

  const onTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue("type", value);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger className="w-[180px] bg-white border-2 border-gray-200 shadow-sm">
          <SelectValue placeholder="Filtrar por período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os períodos</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="week">Últimos 7 dias</SelectItem>
          <SelectItem value="month">Último mês</SelectItem>
          <SelectItem value="custom">Período personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      {(dateFilter === 'custom') && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-white border-2 border-gray-200 shadow-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data inicial'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <span>até</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal bg-white border-2 border-gray-200 shadow-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data final'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Professional filter */}
      {(currentUser?.isManager) && (
        <Form {...form}>
          <FormField
            control={form.control}
            name="professional"
            render={() => (
              <FormItem>
                <Select 
                  value={selectedProfessional || "all"} 
                  onValueChange={onProfessionalChange}
                >
                  <SelectTrigger className="w-[180px] bg-white border-2 border-gray-200 shadow-sm">
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={String(member.id)}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </Form>
      )}
      
      {/* Type filter (Product/Service) */}
      <Form {...form}>
        <FormField
          control={form.control}
          name="type"
          render={() => (
            <FormItem>
              <Select 
                value={selectedType} 
                onValueChange={onTypeChange}
              >
                <SelectTrigger className="w-[180px] bg-white border-2 border-gray-200 shadow-sm">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="servico">Apenas Serviços</SelectItem>
                  <SelectItem value="produto">Apenas Produtos</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default DashboardFilters;

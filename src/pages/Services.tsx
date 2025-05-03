
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ServiceCard from '@/components/Services/ServiceCard';
import { services } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types';

const Services = () => {
  const [open, setOpen] = useState(false);
  const [servicesList, setServicesList] = useState([...services]);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      image: '/placeholder.svg'
    }
  });

  const onSubmit = (data: any) => {
    const newService: Service = {
      id: servicesList.length + 1,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      image: data.image || '/placeholder.svg'
    };

    setServicesList([...servicesList, newService]);
    toast({
      title: "Serviço adicionado",
      description: `${data.name} foi adicionado com sucesso.`
    });
    setOpen(false);
    form.reset();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Serviços</h1>
          <Button onClick={() => setOpen(true)} className="bg-salon-purple hover:bg-salon-dark-purple">
            <Plus className="mr-2" size={18} />
            Novo Serviço
          </Button>
        </div>
        
        <p className="text-gray-500">
          Selecione os serviços para adicionar ao carrinho.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar novo serviço</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo serviço.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do serviço" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do serviço" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Services;

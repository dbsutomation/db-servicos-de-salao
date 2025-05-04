
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ServiceCard from '@/components/Services/ServiceCard';
import { services } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Camera, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Service } from '@/types';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const Services = () => {
  const [open, setOpen] = useState(false);
  const [servicesList, setServicesList] = useState(services.map(service => ({ ...service, commission: 100 })));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      commission: '100',
      image: '/placeholder.svg'
    }
  });

  const handleEditService = (service: Service) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      commission: service.commission.toString(),
      image: service.image
    });
    setImagePreview(service.image);
    setOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.onchange = (e) => {
      const event = e as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(event);
    };
    fileInput.click();
  };

  const handleGallerySelection = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const event = e as React.ChangeEvent<HTMLInputElement>;
      handleImageUpload(event);
    };
    fileInput.click();
  };

  const resetForm = () => {
    form.reset({
      name: '',
      description: '',
      price: '',
      commission: '100',
      image: '/placeholder.svg'
    });
    setImagePreview(null);
    setEditingService(null);
    setOpen(false);
  };

  const onSubmit = (data: any) => {
    if (editingService) {
      // Update existing service
      const updatedServicesList = servicesList.map(service => 
        service.id === editingService.id 
          ? {
              ...service,
              name: data.name,
              description: data.description,
              price: parseFloat(data.price),
              commission: parseFloat(data.commission),
              image: data.image
            } 
          : service
      );
      
      setServicesList(updatedServicesList);
      toast({
        title: "Serviço atualizado",
        description: `${data.name} foi atualizado com sucesso.`
      });
    } else {
      // Add new service
      const newService: Service = {
        id: servicesList.length + 1,
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        commission: parseFloat(data.commission),
        image: data.image || '/placeholder.svg'
      };
      
      setServicesList([...servicesList, newService]);
      toast({
        title: "Serviço adicionado",
        description: `${data.name} foi adicionado com sucesso.`
      });
    }
    
    resetForm();
  };

  const confirmDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteService = () => {
    if (serviceToDelete) {
      const filteredServices = servicesList.filter(
        service => service.id !== serviceToDelete.id
      );
      setServicesList(filteredServices);
      toast({
        title: "Serviço removido",
        description: `${serviceToDelete.name} foi removido com sucesso.`
      });
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Serviços</h1>
          <Button 
            onClick={() => { 
              resetForm();
              setOpen(true); 
            }} 
            className="bg-salon-purple hover:bg-salon-dark-purple"
          >
            <Plus className="mr-2" size={18} />
            Novo Serviço
          </Button>
        </div>
        
        <p className="text-gray-500">
          Selecione os serviços para adicionar ao carrinho ou editar.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service) => (
            <div key={service.id} className="relative">
              <ServiceCard 
                service={service} 
              />
              <Button
                onClick={() => handleEditService(service)}
                className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-white/80 hover:bg-white"
              >
                <Pencil className="h-4 w-4 text-salon-purple" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { 
        if (!isOpen) resetForm();
        setOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar serviço' : 'Adicionar novo serviço'}</DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Edite os campos abaixo para atualizar o serviço.'
                : 'Preencha os campos abaixo para adicionar um novo serviço.'
              }
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
              
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" max="100" placeholder="100" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagem</FormLabel>
                    <div className="space-y-4">
                      {imagePreview && (
                        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCameraCapture}
                          className="flex gap-2 items-center"
                        >
                          <Camera size={18} />
                          Câmera
                        </Button>
                        
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleGallerySelection}
                          className="flex gap-2 items-center"
                        >
                          <Image size={18} />
                          Galeria
                        </Button>
                        
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex gap-2 items-center"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Image size={18} />
                            Arquivo
                          </Button>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <input type="hidden" {...field} />
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                {editingService && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => confirmDeleteService(editingService)}
                  >
                    Excluir
                  </Button>
                )}
                <div className="flex-1"></div>
                <Button type="button" variant="outline" onClick={() => resetForm()}>Cancelar</Button>
                <Button type="submit">{editingService ? 'Atualizar' : 'Salvar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Services;


import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ServiceListItem from '@/components/Services/ServiceListItem';
import DurationField from '@/components/Services/DurationField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Camera, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Service, TeamMember } from '@/types';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { fetchTeamMembers } from '@/services/teamService';

const serviceCategories = [
  { value: 'Cabelo', label: 'Cabelo' },
  { value: 'Depilação', label: 'Depilação' },
  { value: 'Podologia', label: 'Podologia' },
  { value: 'Sobrancelhas', label: 'Sobrancelhas' },
  { value: 'Unhas', label: 'Unhas' }
];

const Services = () => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      commission: '100',
      image: '/placeholder.svg',
      category: 'Cabelo',
      type: 'servico',
      duration: '60'
    }
  });

  // Fetch services and team members
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price, commission, category, type, duration, description');
        
        if (servicesError) throw servicesError;
        
        const typedServices = servicesData?.map(service => ({
          ...service,
          type: service.type === 'produto' ? 'produto' as const : 'servico' as const,
          price: Number(service.price),
          commission: Number(service.commission),
          duration: service.duration || 60
        })) || [];
        
        setServicesList(typedServices);

        // Fetch team members
        const members = await fetchTeamMembers();
        setTeamMembers(members);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Não foi possível carregar os dados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter services based on selected professional and search term
  const filteredServices = servicesList.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;

    if (!matchesSearch || !matchesCategory) return false;

    if (selectedProfessional === 'all') return true;

    const professional = teamMembers.find(member => member.id === selectedProfessional);
    if (professional && professional.categories && service.category) {
      return professional.categories.includes(service.category);
    }

    return false;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedProfessional, selectedCategory]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;
    if (visibleCount >= filteredServices.length) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredServices.length));
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, visibleCount, filteredServices.length]);

  const visibleServices = filteredServices.slice(0, visibleCount);

  const handleEditService = async (service: Service) => {
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem editar serviços e produtos.",
        variant: "destructive"
      });
      return;
    }

    // Lazy-load image only when entering edit mode
    let serviceImage = '/placeholder.svg';
    try {
      const { data: imgData } = await supabase
        .from('services')
        .select('image')
        .eq('id', service.id)
        .maybeSingle();
      if (imgData?.image) serviceImage = imgData.image;
    } catch (e) {
      // ignore, fallback to placeholder
    }

    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      commission: service.commission.toString(),
      image: serviceImage,
      category: service.category || 'Cabelo',
      type: service.type || 'servico',
      duration: (service.duration || 60).toString()
    });
    setImagePreview(serviceImage);
    setOpen(true);
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploadingImage(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      setImagePreview(publicUrl);
      form.setValue('image', publicUrl);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar imagem',
        description: error.message || 'Não foi possível enviar a imagem. Verifique se o bucket service-images existe.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCameraCapture = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.onchange = (e) => {
      const event = e as unknown as ChangeEvent<HTMLInputElement>;
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
      image: '/placeholder.svg',
      category: 'Cabelo',
      type: 'servico',
      duration: '60'
    });
    setImagePreview(null);
    setEditingService(null);
    setOpen(false);
  };

  const onSubmit = async (data: any) => {
    try {
      const serviceData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        commission: parseFloat(data.commission),
        image: data.image || '/placeholder.svg',
        category: data.category,
        type: data.type,
        duration: parseInt(data.duration) || 60
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
          
        if (error) throw error;
        
        setServicesList(prevServices => 
          prevServices.map(service => 
            service.id === editingService.id 
              ? { ...service, ...serviceData }
              : service
          )
        );
        
        toast({
          title: data.type === 'produto' ? "Produto atualizado" : "Serviço atualizado",
          description: `${data.name} foi atualizado com sucesso.`
        });
      } else {
        const { data: newService, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select();
          
        if (error) throw error;
        
        if (newService && newService[0]) {
          setServicesList([...servicesList, newService[0] as Service]);
          
          toast({
            title: data.type === 'produto' ? "Produto adicionado" : "Serviço adicionado",
            description: `${data.name} foi adicionado com sucesso.`
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o item",
        variant: "destructive"
      });
      return;
    }
    
    resetForm();
  };

  const confirmDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (serviceToDelete) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceToDelete.id);
          
        if (error) throw error;
        
        setServicesList(servicesList.filter(service => service.id !== serviceToDelete.id));
        
        toast({
          title: serviceToDelete.type === 'produto' ? "Produto removido" : "Serviço removido",
          description: `${serviceToDelete.name} foi removido com sucesso.`
        });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao excluir o item",
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      }
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Serviços e Produtos</h1>
          {currentUser?.isManager && (
            <Button 
              onClick={() => { 
                resetForm();
                setOpen(true); 
              }} 
              className="bg-salon-purple hover:bg-salon-dark-purple"
            >
              <Plus className="mr-2" size={18} />
              Novo Item
            </Button>
          )}
        </div>
        
        <p className="text-gray-500">
          {currentUser?.isManager ? 
            "Selecione os serviços ou produtos para adicionar ao carrinho ou editar." :
            "Selecione os serviços ou produtos para adicionar ao carrinho."
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por nome, descrição ou categoria" 
              className="pl-10 border-2 border-gray-200 shadow-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filtrar por profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Todos' },
            ...serviceCategories,
          ].map((cat) => (
            <Button
              key={cat.value}
              type="button"
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className={selectedCategory === cat.value ? 'bg-salon-purple hover:bg-salon-dark-purple' : ''}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando serviços e produtos...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {visibleServices.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  canEdit={currentUser?.isManager}
                  onEdit={handleEditService}
                />
              ))}

              {filteredServices.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
                  {searchTerm || selectedProfessional !== 'all' || selectedCategory !== 'all' ? 'Nenhum serviço ou produto encontrado para os filtros aplicados' : 'Nenhum serviço ou produto cadastrado'}
                </div>
              )}
            </div>
            {visibleCount < filteredServices.length && (
              <div ref={sentinelRef} className="flex justify-center py-6 text-sm text-gray-500">
                Carregando mais...
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => { 
        if (!isOpen) resetForm();
        setOpen(isOpen);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Edite os campos abaixo para atualizar.'
                : 'Preencha os campos abaixo para adicionar.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="servico" id="tipo-servico" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer" htmlFor="tipo-servico">
                            Serviço
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="produto" id="tipo-produto" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer" htmlFor="tipo-produto">
                            Produto
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do item" {...field} />
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
                      <Input placeholder="Descrição do item" {...field} />
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

              <DurationField form={form} />
              
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
                          disabled={uploadingImage}
                          className="flex gap-2 items-center"
                        >
                          <Camera size={18} />
                          {uploadingImage ? 'Enviando...' : 'Imagem'}
                        </Button>
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
              Tem certeza que deseja excluir "{serviceToDelete?.name}"? Esta ação não pode ser desfeita.
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

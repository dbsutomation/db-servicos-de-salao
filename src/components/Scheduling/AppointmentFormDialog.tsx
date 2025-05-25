
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, Client, TeamMember } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface AppointmentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: {
    date: string;
    time: string;
    professionalId: string;
  } | null;
  selectedProfessional?: TeamMember;
  onAppointmentCreated: () => void;
}

interface SelectedService {
  service: Service | null;
  quantity: number;
}

const AppointmentFormDialog = ({
  isOpen,
  onClose,
  selectedSlot,
  selectedProfessional,
  onAppointmentCreated
}: AppointmentFormDialogProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchServices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Filter services based on selected professional's categories
  useEffect(() => {
    console.log('Filtering services for professional:', selectedProfessional?.name);
    console.log('Professional categories:', selectedProfessional?.categories);
    console.log('All services:', services.map(s => ({ name: s.name, category: s.category })));

    if (services.length > 0 && selectedProfessional) {
      const professionalCategories = selectedProfessional.categories || [];
      
      console.log('Professional categories array:', professionalCategories);
      
      if (professionalCategories.length === 0) {
        console.log('Professional has no categories, showing all services');
        setFilteredServices(services);
      } else {
        // Filter services by professional's categories
        const filtered = services.filter(service => {
          if (!service.category) {
            console.log(`Service "${service.name}" has no category`);
            return false;
          }
          
          const hasCategory = professionalCategories.includes(service.category);
          console.log(`Service "${service.name}" (category: ${service.category}) - included: ${hasCategory}`);
          return hasCategory;
        });
        
        console.log('Filtered services:', filtered.map(s => s.name));
        setFilteredServices(filtered);
      }
    } else {
      console.log('No professional selected or no services loaded, showing all services');
      setFilteredServices(services);
    }
  }, [services, selectedProfessional]);

  const resetForm = () => {
    setSelectedClient('');
    setSelectedServices([]);
    setNotes('');
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setShowNewClientForm(false);
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('Services fetched from database:', data);
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const createNewClient = async () => {
    if (!newClientName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do cliente é obrigatório.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: newClientName.trim(),
          phone: newClientPhone.trim() || null,
          email: newClientEmail.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data]);
      return data.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addService = () => {
    // Add service with null service (blank field) so user must select
    setSelectedServices(prev => [...prev, { service: null, quantity: 1 }]);
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, serviceId: string) => {
    const service = filteredServices.find(s => s.id === serviceId);
    if (service) {
      setSelectedServices(prev => 
        prev.map((item, i) => 
          i === index ? { ...item, service } : item
        )
      );
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    setSelectedServices(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, item) => {
      if (!item.service) return total;
      const serviceDuration = item.service.duration || 60;
      return total + (serviceDuration * item.quantity);
    }, 0);
  };

  const calculateTotalValue = () => {
    return selectedServices.reduce((total, item) => {
      if (!item.service) return total;
      return total + (item.service.price * item.quantity);
    }, 0);
  };

  const calculateEndTime = () => {
    if (!selectedSlot) return '';
    
    const totalMinutes = calculateTotalDuration();
    const [hours, minutes] = selectedSlot.time.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    return `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !selectedProfessional) return;

    let clientId = selectedClient;

    // Criar novo cliente se necessário
    if (showNewClientForm) {
      const newClientId = await createNewClient();
      if (!newClientId) return;
      clientId = newClientId;
    }

    if (!clientId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    // Check if all services are selected
    const hasUnselectedServices = selectedServices.some(item => !item.service);
    if (hasUnselectedServices) {
      toast({
        title: "Erro",
        description: "Selecione todos os serviços adicionados.",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalDuration = calculateTotalDuration();
      const totalValue = calculateTotalValue();
      const endTime = calculateEndTime();

      // Criar o agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          appointment_date: selectedSlot.date,
          start_time: selectedSlot.time,
          end_time: endTime,
          client_id: clientId,
          professional_id: selectedSlot.professionalId,
          total_duration: totalDuration,
          total_value: totalValue,
          status: 'scheduled',
          notes: notes.trim() || null
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Criar os serviços do agendamento
      const appointmentServices = selectedServices
        .filter(item => item.service) // Only include items with selected services
        .map(item => ({
          appointment_id: appointment.id,
          service_id: item.service!.id,
          quantity: item.quantity,
          unit_price: item.service!.price
        }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) throw servicesError;

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });

      onAppointmentCreated();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSlot) return null;

  const selectedDate = new Date(selectedSlot.date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Profissional</Label>
              <Input
                value={selectedProfessional?.name || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Data e Hora</Label>
              <Input
                value={`${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às ${selectedSlot.time}`}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Cliente</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewClientForm(!showNewClientForm)}
              >
                {showNewClientForm ? 'Selecionar Existente' : 'Novo Cliente'}
              </Button>
            </div>

            {showNewClientForm ? (
              <div className="space-y-2 p-4 border rounded-lg">
                <Input
                  placeholder="Nome do cliente *"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  placeholder="Telefone"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>
            ) : (
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.phone && `- ${client.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Serviços */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Serviços</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                disabled={filteredServices.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>

            {filteredServices.length === 0 && (
              <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg">
                Nenhum serviço disponível para as categorias do profissional selecionado.
                <br />
                <span className="text-xs">
                  Categorias do profissional: {selectedProfessional?.categories?.join(', ') || 'Nenhuma categoria definida'}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {selectedServices.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Select
                    value={item.service?.id || ''}
                    onValueChange={(value) => updateService(index, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {service.price.toFixed(2)} ({service.duration || 60}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeService(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          {selectedServices.some(item => item.service) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Resumo do Agendamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Duração Total:</span>
                  <span>{calculateTotalDuration()} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span>Horário Final:</span>
                  <span>{calculateEndTime()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Valor Total:</span>
                  <span>R$ {calculateTotalValue().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Observações sobre o agendamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Agendamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFormDialog;

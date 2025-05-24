
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TeamMember, Service, Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentFormProps {
  professional: TeamMember;
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedService {
  service: Service;
  quantity: number;
}

const AppointmentForm = ({ professional, selectedDate, selectedTime, onClose, onSuccess }: AppointmentFormProps) => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Buscar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
        return;
      }

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (clientsError) {
        console.error('Erro ao buscar clientes:', clientsError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os clientes.",
          variant: "destructive",
        });
        return;
      }

      setServices(servicesData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, item) => {
      return total + (item.service.duration || 60) * item.quantity;
    }, 0);
  };

  const calculateTotalValue = () => {
    return selectedServices.reduce((total, item) => {
      return total + item.service.price * item.quantity;
    }, 0);
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleServiceToggle = (service: Service, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, { service, quantity: 1 }]);
    } else {
      setSelectedServices(prev => prev.filter(item => item.service.id !== service.id));
    }
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    setSelectedServices(prev => 
      prev.map(item => 
        item.service.id === serviceId 
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handleCreateNewClient = async (): Promise<string | null> => {
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
          email: newClientEmail.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o cliente.",
          variant: "destructive",
        });
        return null;
      }

      // Atualizar lista de clientes
      setClients(prev => [...prev, data]);
      
      return data.id;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    let clientId = selectedClientId;
    
    if (isCreatingNewClient) {
      clientId = await handleCreateNewClient() || '';
      if (!clientId) return;
    }

    if (!clientId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const totalDuration = calculateTotalDuration();
      const totalValue = calculateTotalValue();
      const endTime = calculateEndTime(selectedTime, totalDuration);

      // Criar agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          professional_id: professional.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime,
          end_time: endTime,
          total_duration: totalDuration,
          total_value: totalValue,
          status: 'scheduled',
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Erro ao criar agendamento:', appointmentError);
        toast({
          title: "Erro",
          description: "Não foi possível criar o agendamento.",
          variant: "destructive",
        });
        return;
      }

      // Criar serviços do agendamento
      const appointmentServices = selectedServices.map(item => ({
        appointment_id: appointmentData.id,
        service_id: item.service.id,
        quantity: item.quantity,
        unit_price: item.service.price,
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) {
        console.error('Erro ao criar serviços do agendamento:', servicesError);
        toast({
          title: "Erro",
          description: "Agendamento criado, mas houve erro ao adicionar os serviços.",
          variant: "destructive",
        });
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Erro geral ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Novo Agendamento - {professional.name}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Cliente */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-client"
                checked={isCreatingNewClient}
                onCheckedChange={setIsCreatingNewClient}
              />
              <Label htmlFor="new-client">Criar novo cliente</Label>
            </div>

            {isCreatingNewClient ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-name">Nome do Cliente *</Label>
                  <Input
                    id="client-name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="client-phone">Telefone</Label>
                  <Input
                    id="client-phone"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">E-mail</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="client-select">Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Seleção de Serviços */}
          <div className="space-y-4">
            <Label>Serviços *</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-4">
              {services.map((service) => {
                const selectedService = selectedServices.find(item => item.service.id === service.id);
                const isSelected = !!selectedService;
                
                return (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name} - R$ {service.price.toFixed(2)}
                        {service.duration && (
                          <span className="text-gray-500"> ({service.duration}min)</span>
                        )}
                      </Label>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`qty-${service.id}`} className="text-sm">Qtd:</Label>
                        <Input
                          id={`qty-${service.id}`}
                          type="number"
                          min="1"
                          value={selectedService.quantity}
                          onChange={(e) => handleQuantityChange(service.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          {selectedServices.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Agendamento</h4>
              <p className="text-sm">Duração total: {calculateTotalDuration()} minutos</p>
              <p className="text-sm">Valor total: R$ {calculateTotalValue().toFixed(2)}</p>
              <p className="text-sm">
                Horário: {selectedTime} - {calculateEndTime(selectedTime, calculateTotalDuration())}
              </p>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;

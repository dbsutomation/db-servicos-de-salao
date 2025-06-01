
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, Client, Appointment } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
}

interface SelectedService {
  service: Service | null;
  quantity: number;
}

export const EditAppointmentDialog = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated
}: EditAppointmentDialogProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && appointment) {
      fetchClients();
      fetchServices();
      loadAppointmentData();
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedClient('');
    setSelectedServices([]);
    setNotes('');
    setStartTime('');
  };

  const loadAppointmentData = async () => {
    if (!appointment) return;

    try {
      const { data: appointmentServices, error } = await supabase
        .from('appointment_services')
        .select(`
          *,
          services!inner(*)
        `)
        .eq('appointment_id', appointment.id);

      if (error) throw error;

      const mappedServices: SelectedService[] = appointmentServices.map(as => ({
        service: as.services,
        quantity: as.quantity
      }));

      setSelectedClient(appointment.client_id);
      setSelectedServices(mappedServices);
      setNotes(appointment.notes || '');
      setStartTime(appointment.start_time.substring(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados do agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do agendamento.",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const mappedClients: Client[] = (data || []).map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        created_at: client.created_at,
        updated_at: client.updated_at,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }));
      
      setClients(mappedClients);
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
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const addService = () => {
    setSelectedServices(prev => [...prev, { service: null, quantity: 1 }]);
  };

  const removeService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
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
    if (!startTime) return '';
    
    const totalMinutes = calculateTotalDuration();
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime() + totalMinutes * 60000);
    return `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment) return;

    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

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

      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          start_time: startTime,
          end_time: endTime,
          client_id: selectedClient,
          total_duration: totalDuration,
          total_value: totalValue,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (appointmentError) throw appointmentError;

      const { error: deleteError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointment.id);

      if (deleteError) throw deleteError;

      const appointmentServices = selectedServices
        .filter(item => item.service)
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
        description: "Agendamento atualizado com sucesso!",
      });

      onAppointmentUpdated();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.appointment_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data</Label>
              <Input
                value={format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR })}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
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
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>

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
                      {services.map((service) => (
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
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

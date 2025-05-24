
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { TeamMember, Service } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Calendar, DollarSign, X } from 'lucide-react';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  professional: TeamMember;
  selectedDate: Date;
  selectedTime: string;
  onAppointmentCreated: () => void;
}

interface SelectedService {
  service: Service;
  quantity: number;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  professional,
  selectedDate,
  selectedTime,
  onAppointmentCreated
}) => {
  const { currentUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar serviços:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os serviços.",
          variant: "destructive",
        });
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleAddService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const existingIndex = selectedServices.findIndex(s => s.service.id === serviceId);
    if (existingIndex >= 0) {
      // Incrementar quantidade se já existe
      const updated = [...selectedServices];
      updated[existingIndex].quantity += 1;
      setSelectedServices(updated);
    } else {
      // Adicionar novo serviço
      setSelectedServices([...selectedServices, { service, quantity: 1 }]);
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId));
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveService(serviceId);
      return;
    }

    setSelectedServices(selectedServices.map(s => 
      s.service.id === serviceId ? { ...s, quantity } : s
    ));
  };

  const calculateTotals = () => {
    let totalDuration = 0;
    let totalValue = 0;

    selectedServices.forEach(({ service, quantity }) => {
      totalDuration += (service.duration || 60) * quantity;
      totalValue += service.price * quantity;
    });

    return { totalDuration, totalValue };
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || selectedServices.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { totalDuration, totalValue } = calculateTotals();
      const endTime = calculateEndTime(selectedTime, totalDuration);
      const appointmentDate = format(selectedDate, 'yyyy-MM-dd');

      // Criar o agendamento
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: currentUser.id,
          professional_id: professional.id,
          appointment_date: appointmentDate,
          start_time: selectedTime,
          end_time: endTime,
          total_duration: totalDuration,
          total_value: totalValue,
          notes: notes.trim() || null,
          status: 'scheduled'
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

      // Criar os serviços do agendamento
      const appointmentServices = selectedServices.map(({ service, quantity }) => ({
        appointment_id: appointmentData.id,
        service_id: service.id,
        quantity,
        unit_price: service.price
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) {
        console.error('Erro ao adicionar serviços:', servicesError);
        // Tentar remover o agendamento criado
        await supabase.from('appointments').delete().eq('id', appointmentData.id);
        
        toast({
          title: "Erro",
          description: "Não foi possível adicionar os serviços ao agendamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Agendamento criado!",
        description: `Seu agendamento foi marcado para ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })} às ${selectedTime}.`,
      });

      // Limpar formulário e fechar
      setSelectedServices([]);
      setNotes('');
      onAppointmentCreated();
      onClose();

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { totalDuration, totalValue } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do agendamento */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Profissional:</span> {professional.name}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Data:</span> {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Horário:</span> {selectedTime}
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Duração:</span> {totalDuration} min
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seleção de serviços */}
          <div>
            <Label className="text-base font-medium">Selecionar Serviços</Label>
            <div className="mt-2">
              <Select onValueChange={handleAddService}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {servicesLoading ? (
                    <SelectItem value="loading">Carregando...</SelectItem>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)} ({service.duration || 60} min)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Serviços selecionados */}
          {selectedServices.length > 0 && (
            <div>
              <Label className="text-base font-medium">Serviços Selecionados</Label>
              <div className="mt-2 space-y-2">
                {selectedServices.map(({ service, quantity }) => (
                  <Card key={service.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-gray-600">
                            R$ {service.price.toFixed(2)} • {service.duration || 60} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(service.id, quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(service.id, quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(service.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {selectedServices.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-lg font-medium">
                  <span>Total:</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {totalDuration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      R$ {totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação ou pedido especial..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedServices.length === 0}
              className="bg-salon-purple hover:bg-salon-dark-purple"
            >
              {loading ? 'Criando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentForm;


import React, { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockPeriodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string | null;
  onPeriodBlocked: () => void;
}

const BlockPeriodDialog = ({
  isOpen,
  onClose,
  professionalId,
  onPeriodBlocked
}: BlockPeriodDialogProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime('');
    setEndTime('');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!professionalId) {
      toast({
        title: "Erro",
        description: "Profissional não selecionado.",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !startTime) {
      toast({
        title: "Erro",
        description: "Selecione a data e horário de início.",
        variant: "destructive",
      });
      return;
    }

    const finalEndDate = endDate || startDate;
    const finalEndTime = endTime || startTime;

    setLoading(true);

    try {
      // Criar período bloqueado
      const { error } = await supabase
        .from('blocked_periods')
        .insert({
          professional_id: professionalId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(finalEndDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: finalEndTime,
          reason: reason.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Período bloqueado com sucesso!",
      });

      onPeriodBlocked();
      resetForm();
    } catch (error) {
      console.error('Erro ao bloquear período:', error);
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o período.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bloquear Período da Agenda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data de Início */}
          <div>
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Fim (opcional) */}
          <div>
            <Label>Data de Fim (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : "Mesmo dia da data de início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < (startDate || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Horário de Fim</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <Label>Motivo (opcional)</Label>
            <Textarea
              placeholder="Ex: Férias, compromisso pessoal, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear Período
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlockPeriodDialog;


import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/types';

interface DeleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  appointment: Appointment | null;
}

export const DeleteAppointmentDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  appointment 
}: DeleteAppointmentDialogProps) => {
  if (!appointment) return null;

  const appointmentDate = new Date(appointment.appointment_date);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão do agendamento</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.</p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Cliente:</strong> {appointment.client_name}</p>
              <p><strong>Serviço:</strong> {appointment.service_name}</p>
              <p><strong>Data:</strong> {format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir Agendamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

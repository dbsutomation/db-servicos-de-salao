import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ClientForm from '@/components/Forms/ClientForm';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';
import type { ClientFormValues } from '@/lib/clientValidation';

interface Props {
  disabled: boolean;
  onCreated: (client: Client) => void;
}

export default function QuickClientCreate({ disabled, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const saveClient = async (values: ClientFormValues) => {
    try {
      const salonId = await getCurrentSalonId();
      if (!salonId) throw new Error('Não foi possível identificar seu estabelecimento. Entre novamente.');
      const { data, error } = await supabase.from('clients').insert({
        name: values.name,
        phone: values.phone || null,
        email: values.email || null,
        salon_id: salonId,
      }).select().single();
      if (error) throw error;
      onCreated(data);
      setOpen(false);
      toast({ title: 'Cliente cadastrado e selecionado' });
      return true;
    } catch (error) {
      toast({ title: 'Erro ao cadastrar cliente', description: error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.', variant: 'destructive' });
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
        <ClientForm onSuccess={saveClient} />
      </DialogContent>
    </Dialog>
  );
}
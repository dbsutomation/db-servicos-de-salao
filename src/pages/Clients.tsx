
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ClientForm from '@/components/Forms/ClientForm';
import { Search, Edit, Trash2, Plus, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Client } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSalonId } from '@/lib/salon';

const Clients = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*');
        
        if (error) throw error;
        
        setClientsList(data || []);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar clientes",
          description: error.message || "Não foi possível carregar os clientes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clientsList.filter((client) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm)) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSuccess = async (updatedClient: any) => {
    try {
      if (editingClient) {
        // Update existing client in Supabase
        const { error } = await supabase
          .from('clients')
          .update({
            name: updatedClient.name,
            phone: updatedClient.phone,
            email: updatedClient.email
          })
          .eq('id', editingClient);
          
        if (error) throw error;
        
        // Update local state
        setClientsList(prevClients => 
          prevClients.map(client => 
            client.id === editingClient ? { ...client, ...updatedClient } : client
          )
        );
        
        toast({
          title: "Cliente atualizado",
          description: `${updatedClient.name} foi atualizado com sucesso.`
        });
      } else {
        // Add new client to Supabase
        const salonId = await getCurrentSalonId();
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: updatedClient.name,
            phone: updatedClient.phone,
            email: updatedClient.email,
            salon_id: salonId,
          } as any)
          .select();
          
          
        if (error) throw error;
        
        if (data && data[0]) {
          // Add to local state
          setClientsList(prevClients => [...prevClients, data[0] as Client]);
          
          toast({
            title: "Cliente adicionado",
            description: `${updatedClient.name} foi adicionado com sucesso.`
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o cliente",
        variant: "destructive"
      });
      return;
    }
    
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (clientId: string) => {
    setEditingClient(clientId);
    setDialogOpen(true);
  };

  const confirmDeleteClient = (clientId: string) => {
    // Only managers can delete clients
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem excluir clientes.",
        variant: "destructive"
      });
      return;
    }
    
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (clientToDelete) {
      try {
        const client = clientsList.find(c => c.id === clientToDelete);
        
        // Delete from Supabase
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientToDelete);
          
        if (error) throw error;
        
        // Update local state
        setClientsList(clientsList.filter(c => c.id !== clientToDelete));
        
        if (client) {
          toast({
            title: "Cliente removido",
            description: `${client.name} foi removido com sucesso.`
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao excluir o cliente",
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setClientToDelete(null);
      }
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Clientes</h1>
          
          <div className="flex items-center gap-2">
            {currentUser?.salonId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = `${window.location.origin}/cadastro-cliente/${currentUser.salonId}`;
                  navigator.clipboard.writeText(link);
                  toast({ title: 'Link copiado!', description: 'Compartilhe com seus clientes para que se cadastrem.' });
                }}
              >
                <Share2 className="mr-2" size={16} />
                Copiar link de cadastro
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-salon-purple hover:bg-salon-dark-purple shadow-md"
                  onClick={() => setEditingClient(null)}
                >
                  <Plus className="mr-2" size={18} />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                </DialogHeader>
                <ClientForm onSuccess={handleSuccess} clientId={editingClient} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Buscar por nome, telefone ou email" 
            className="pl-10 border-2 border-gray-200 shadow-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="bg-white rounded-lg shadow-md border-2 border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="p-6 flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0 bg-salon-purple/20">
                    <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
                      {client.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg truncate">{client.name}</h3>
                    
                    <div className="mt-2 space-y-1 text-sm">
                      {client.phone && (
                        <p className="truncate"><span className="font-medium">Telefone:</span> {client.phone}</p>
                      )}
                      {client.email && (
                        <p className="truncate"><span className="font-medium">Email:</span> {client.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleEdit(client.id); }}
                      className="h-8 w-8"
                    >
                      <Edit size={16} />
                    </Button>
                    {currentUser?.isManager && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); confirmDeleteClient(client.id); }}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredClients.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Clients;


import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { clients } from '@/data/mockData';
import ClientForm from '@/components/Forms/ClientForm';
import { Search, Edit, Trash2, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Clients = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [clientsList, setClientsList] = useState(clients);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const filteredClients = clientsList.filter((client) => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm)) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSuccess = (updatedClient: any) => {
    if (editingClient) {
      // Update existing client
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
      // Add new client
      const newClient = {
        id: Math.max(0, ...clientsList.map(c => c.id)) + 1,
        ...updatedClient
      };
      setClientsList(prevClients => [...prevClients, newClient]);
      toast({
        title: "Cliente adicionado",
        description: `${updatedClient.name} foi adicionado com sucesso.`
      });
    }
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (clientId: number) => {
    setEditingClient(clientId);
    setDialogOpen(true);
  };

  const confirmDeleteClient = (clientId: number) => {
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

  const handleDeleteClient = () => {
    if (clientToDelete) {
      const client = clientsList.find(c => c.id === clientToDelete);
      setClientsList(clientsList.filter(c => c.id !== clientToDelete));
      
      if (client) {
        toast({
          title: "Cliente removido",
          description: `${client.name} foi removido com sucesso.`
        });
      }
      
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Clientes</h1>
          
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
              </DialogHeader>
              <ClientForm onSuccess={handleSuccess} clientId={editingClient} />
            </DialogContent>
          </Dialog>
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-lg shadow-md border-2 border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex items-start gap-4">
                <Avatar className="h-16 w-16 bg-salon-purple/20">
                  <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
                    {client.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{client.name}</h3>
                  
                  <div className="mt-2 space-y-1 text-sm">
                    {client.phone && (
                      <p><span className="font-medium">Telefone:</span> {client.phone}</p>
                    )}
                    {client.email && (
                      <p><span className="font-medium">Email:</span> {client.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(client.id)}
                    className="h-8 w-8"
                  >
                    <Edit size={16} />
                  </Button>
                  {currentUser?.isManager && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteClient(client.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </div>
          )}
        </div>
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

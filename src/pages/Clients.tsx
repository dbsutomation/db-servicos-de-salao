
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { clients } from '@/data/mockData';
import ClientForm from '@/components/Forms/ClientForm';
import { Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
                className="bg-salon-purple hover:bg-salon-dark-purple"
                onClick={() => setEditingClient(null)}
              >
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Buscar por nome, telefone ou email" 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="py-3 px-4 text-left">Nome</th>
                <th className="py-3 px-4 text-left">Telefone</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/50">
                  <td className="py-3 px-4">{client.name}</td>
                  <td className="py-3 px-4">{client.phone || '-'}</td>
                  <td className="py-3 px-4">{client.email || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-1">
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
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

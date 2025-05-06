
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { teamMembers } from '@/data/mockData';
import { Edit, Plus, Trash2 } from 'lucide-react';
import TeamMemberForm from '@/components/Forms/TeamMemberForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Team = () => {
  const { currentUser } = useAuth();
  const [teamMembersList, setTeamMembersList] = useState(teamMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);

  const handleSuccess = (data: any) => {
    if (editingMember) {
      // Update existing team member
      setTeamMembersList(prevMembers => 
        prevMembers.map(member => 
          member.id === editingMember 
            ? { 
                ...member, 
                ...data, 
                avatar: member.avatar // Keep existing avatar
              }
            : member
        )
      );
      
      toast({
        title: "Membro atualizado",
        description: `${data.name} foi atualizado com sucesso.`
      });
    } else {
      // Add new team member
      const newMember = {
        id: Math.max(0, ...teamMembersList.map(m => m.id)) + 1,
        ...data,
        avatar: '/placeholder.svg'
      };
      
      setTeamMembersList([...teamMembersList, newMember]);
      toast({
        title: "Membro adicionado",
        description: `${data.name} foi adicionado com sucesso.`
      });
    }
    
    setDialogOpen(false);
    setEditingMember(null);
  };

  const handleEdit = (memberId: number) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  };

  const confirmDeleteMember = (memberId: number) => {
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMember = () => {
    if (memberToDelete) {
      const member = teamMembersList.find(m => m.id === memberToDelete);
      
      // Don't allow deleting yourself
      if (member && member.id === currentUser?.id) {
        toast({
          title: "Operação não permitida",
          description: "Você não pode excluir seu próprio perfil.",
          variant: "destructive"
        });
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
        return;
      }
      
      setTeamMembersList(teamMembersList.filter(m => m.id !== memberToDelete));
      
      if (member) {
        toast({
          title: "Membro removido",
          description: `${member.name} foi removido com sucesso.`
        });
      }
      
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Equipe</h1>
          
          {currentUser?.isManager && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-salon-purple hover:bg-salon-dark-purple"
                  onClick={() => setEditingMember(null)}
                >
                  <Plus className="mr-2" size={18} />
                  Novo Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
                </DialogHeader>
                <TeamMemberForm onSuccess={handleSuccess} teamMemberId={editingMember} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembersList.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col"
            >
              <div className="p-6 flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{member.name}</h3>
                  <p className="text-gray-500">{member.profession}</p>
                  
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Email:</span> {member.email}</p>
                    <p><span className="font-medium">Telefone:</span> {member.phone}</p>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    {member.hasAccess && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Acesso ao Sistema
                      </span>
                    )}
                    
                    {member.isManager && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Gerente
                      </span>
                    )}
                  </div>
                </div>
                
                {currentUser?.isManager && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(member.id)}
                      className="h-8 w-8"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteMember(member.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {teamMembersList.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhum membro da equipe cadastrado
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este membro da equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Team;

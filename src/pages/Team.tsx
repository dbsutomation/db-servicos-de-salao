
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Plus, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeamMember } from '@/types';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamMemberForm from '@/components/Team/TeamMemberForm';

const Team = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  
  const {
    teamMembers,
    isLoading,
    handleCreateOrUpdate,
    handleConfirmDelete,
  } = useTeamMembers();

  // Filter team members based on search term
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.profession && member.profession.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (memberId: string) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  };

  const handleDelete = (memberId: string) => {
    // Only managers can delete members (except themselves)
    if (!currentUser?.isManager) {
      toast({
        title: "Acesso negado",
        description: "Apenas gerentes podem excluir membros da equipe.",
        variant: "destructive"
      });
      return;
    }
    
    if (memberId === currentUser?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir sua própria conta.",
        variant: "destructive"
      });
      return;
    }
    
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  };

  const handleMemberSave = async (memberData: TeamMember) => {
    try {
      await handleCreateOrUpdate(memberData);
      setDialogOpen(false);
      setEditingMember(null);
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  const handleMemberDelete = async () => {
    if (memberToDelete) {
      try {
        await handleConfirmDelete(memberToDelete);
      } catch (error) {
        console.error("Error deleting member:", error);
      } finally {
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      }
    }
  };

  const canEditMember = (memberId: string): boolean => {
    // Managers can edit anyone, regular users can only edit themselves
    return currentUser?.isManager || memberId === currentUser?.id;
  };

  const canDeleteMember = (memberId: string): boolean => {
    // Only managers can delete other members, no one can delete themselves
    return currentUser?.isManager && memberId !== currentUser?.id;
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
                  className="bg-salon-purple hover:bg-salon-dark-purple shadow-md"
                  onClick={() => setEditingMember(null)}
                >
                  <Plus className="mr-2" size={18} />
                  Novo Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMember ? 'Editar Membro da Equipe' : 'Adicionar Novo Membro'}</DialogTitle>
                </DialogHeader>
                <TeamMemberForm 
                  member={editingMember ? teamMembers.find(m => m.id === editingMember) || null : null} 
                  onSubmit={handleMemberSave}
                  isLoading={isLoading}
                />
              </DialogContent>
            </Dialog>
          )}
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
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando membros da equipe...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`bg-white rounded-lg shadow-md border-2 ${member.id === currentUser?.id ? 'border-salon-purple/30' : 'border-gray-100'} overflow-hidden flex flex-col`}
              >
                <div className="p-6 flex items-start gap-4">
                  <Avatar className="h-16 w-16 bg-salon-purple/20">
                    <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{member.name}</h3>
                      {member.id === currentUser?.id && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Você
                        </span>
                      )}
                      {member.isManager && (
                        <span className="text-xs bg-salon-purple/20 text-salon-purple px-2 py-0.5 rounded">
                          Gerente
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 space-y-1 text-sm">
                      {member.profession && (
                        <p><span className="font-medium">Profissão:</span> {member.profession}</p>
                      )}
                      {member.phone && (
                        <p><span className="font-medium">Telefone:</span> {member.phone}</p>
                      )}
                      <p><span className="font-medium">Email:</span> {member.email}</p>
                      <p>
                        <span className="font-medium">Status:</span>
                        {' '}
                        {member.hasAccess ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {canEditMember(member.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(member.id)}
                        className="h-8 w-8"
                      >
                        <Edit size={16} />
                      </Button>
                    )}
                    {canDeleteMember(member.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(member.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredMembers.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
                {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
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
              Tem certeza que deseja excluir este membro da equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMemberDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Team;


import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Plus, Trash2 } from 'lucide-react';
import TeamMemberForm from '@/components/Forms/TeamMemberForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const Team = () => {
  const { currentUser } = useAuth();
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch team members from Supabase
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) throw error;
        
        // Transform data to match TeamMember type
        const transformedData = data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          hasAccess: user.has_access,
          isManager: user.is_manager,
          phone: user.phone || '',  // Use empty string if phone is null
          profession: user.profession || '',  // Use empty string if profession is null
          password: '',  // Password is not returned from the database
          avatar: user.avatar || '/placeholder.svg'  // Use placeholder if avatar is null
        }));
        
        setTeamMembersList(transformedData);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar equipe",
          description: error.message || "Não foi possível carregar os membros da equipe",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleSuccess = async (data: any) => {
    try {
      if (editingMember) {
        // Update existing team member in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            profession: data.profession,
            has_access: data.hasAccess,
            is_manager: data.isManager
          })
          .eq('id', editingMember);
          
        if (error) throw error;
        
        // Update local state
        setTeamMembersList(prevMembers => 
          prevMembers.map(member => 
            member.id === editingMember 
              ? { 
                  ...member, 
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  profession: data.profession,
                  hasAccess: data.hasAccess,
                  isManager: data.isManager
                }
              : member
          )
        );
        
        toast({
          title: "Membro atualizado",
          description: `${data.name} foi atualizado com sucesso.`
        });
      } else {
        // Add new team member to Supabase
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            profession: data.profession,
            has_access: data.hasAccess,
            is_manager: data.isManager
          })
          .select();
          
        if (error) throw error;
        
        if (newUser && newUser[0]) {
          // Transform to TeamMember type
          const newMember: TeamMember = {
            id: newUser[0].id,
            name: newUser[0].name,
            email: newUser[0].email,
            phone: newUser[0].phone || '',
            profession: newUser[0].profession || '',
            hasAccess: newUser[0].has_access,
            isManager: newUser[0].is_manager,
            password: '',  // Password is not stored in state
            avatar: '/placeholder.svg'
          };
          
          setTeamMembersList([...teamMembersList, newMember]);
          
          toast({
            title: "Membro adicionado",
            description: `${data.name} foi adicionado com sucesso.`
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o membro da equipe",
        variant: "destructive"
      });
      return;
    }
    
    setDialogOpen(false);
    setEditingMember(null);
  };

  const handleEdit = (memberId: string) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  };

  const confirmDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMember = async () => {
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
      
      try {
        // Delete from Supabase
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', memberToDelete);
          
        if (error) throw error;
        
        // Update local state
        setTeamMembersList(teamMembersList.filter(m => m.id !== memberToDelete));
        
        if (member) {
          toast({
            title: "Membro removido",
            description: `${member.name} foi removido com sucesso.`
          });
        }
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao excluir o membro da equipe",
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      }
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
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando membros da equipe...</p>
          </div>
        ) : (
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
            
            {teamMembersList.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Nenhum membro da equipe cadastrado
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

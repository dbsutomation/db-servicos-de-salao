
import { useState, useEffect } from 'react';
import { TeamMember } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useTeamManagement = () => {
  const { currentUser } = useAuth();
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch team members from Supabase
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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleSuccess = async (data: any) => {
    try {
      if (editingMember) {
        console.log("Atualizando membro:", editingMember, data);
        
        // Preparar dados para atualização
        const updateData: any = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          profession: data.profession,
          has_access: data.hasAccess,
          is_manager: data.isManager
        };
        
        // Se a senha foi fornecida, atualizar em uma chamada separada para segurança
        if (data.password && data.password.trim() !== '') {
          // Em um cenário real, você precisaria de um endpoint seguro para atualizar senhas
          // Esta é uma simulação - em produção, isso seria feito de maneira mais segura
          console.log("Senha nova detectada, atualizando...");
          // Você poderia chamar uma função que lida com a atualização de senha
        }
        
        // Atualizar membro no Supabase
        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingMember);
          
        if (error) throw error;
        
        toast({
          title: "Membro atualizado",
          description: `${data.name} foi atualizado com sucesso.`
        });
        
        // Refresh the team members list after updating
        await fetchTeamMembers();
        
      } else {
        // Preparar dados para inserção
        const insertData: any = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          profession: data.profession,
          has_access: data.hasAccess,
          is_manager: data.isManager
          // Senha seria tratada separadamente em um caso real
        };
        
        // Add new team member to Supabase
        const { error } = await supabase
          .from('users')
          .insert(insertData);
          
        if (error) throw error;
        
        toast({
          title: "Membro adicionado",
          description: `${data.name} foi adicionado com sucesso.`
        });
        
        // Refresh the team members list after adding
        await fetchTeamMembers();
      }
      
      // Close the dialog and reset editing state
      setDialogOpen(false);
      setEditingMember(null);
      
    } catch (error: any) {
      let errorMessage = error.message || "Ocorreu um erro ao salvar o membro da equipe";
      
      // Tratamento específico para erros comuns
      if (error.code === '23505') {
        errorMessage = "Este email já está em uso por outro membro";
      } else if (error.code === '23514') {
        errorMessage = "Os dados fornecidos não atendem às restrições do banco de dados";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
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
        console.log("Excluindo membro:", memberToDelete);
        
        // Delete from Supabase
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', memberToDelete);
          
        if (error) throw error;
        
        if (member) {
          toast({
            title: "Membro removido",
            description: `${member.name} foi removido com sucesso.`
          });
        }
        
        // Refresh the team members list after deletion
        await fetchTeamMembers();
        
      } catch (error: any) {
        let errorMessage = error.message || "Ocorreu um erro ao excluir o membro da equipe";
        
        // Tratamento para erros específicos de exclusão
        if (error.code === '23503') {
          errorMessage = "Este membro não pode ser excluído pois possui registros associados";
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      }
    }
  };

  return {
    teamMembersList,
    dialogOpen,
    setDialogOpen,
    editingMember,
    setEditingMember,
    deleteDialogOpen,
    setDeleteDialogOpen,
    memberToDelete,
    loading,
    handleSuccess,
    handleEdit,
    confirmDeleteMember,
    handleDeleteMember,
  };
};

export default useTeamManagement;

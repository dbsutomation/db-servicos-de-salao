
import React, { useEffect, useCallback } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useTeamManagement from '@/hooks/useTeamManagement';
import TeamList from '@/components/Team/TeamList';
import DeleteConfirmDialog from '@/components/Team/DeleteConfirmDialog';
import TeamMemberDialog from '@/components/Team/TeamMemberDialog';

const Team = () => {
  const { currentUser } = useAuth();
  const {
    teamMembersList,
    dialogOpen,
    setDialogOpen,
    editingMember,
    setEditingMember,
    deleteDialogOpen,
    setDeleteDialogOpen,
    loading,
    handleSuccess,
    handleEdit,
    confirmDeleteMember,
    handleDeleteMember,
    refreshTeamMembers
  } = useTeamManagement();

  // Refresh team members when the page loads, but only once
  useEffect(() => {
    // Initial data load
    refreshTeamMembers();
  }, [refreshTeamMembers]);

  // Handler for adding new team member - memoized to prevent re-renders
  const handleAddMember = useCallback(() => {
    setEditingMember(null);
    setDialogOpen(true);
  }, [setEditingMember, setDialogOpen]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Equipe</h1>
          
          {currentUser?.isManager && (
            <Button 
              className="bg-salon-purple hover:bg-salon-dark-purple"
              onClick={handleAddMember}
            >
              <Plus className="mr-2" size={18} />
              Novo Membro
            </Button>
          )}
        </div>
        
        <TeamList 
          teamMembersList={teamMembersList} 
          onEdit={handleEdit} 
          onDelete={confirmDeleteMember} 
          loading={loading} 
        />
      </div>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMember(null);  // Reset editing state when closing dialog
        }}
        editingMember={editingMember}
        onSuccess={handleSuccess}
        title={editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
      />

      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteMember}
      />
    </MainLayout>
  );
};

export default Team;


import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
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
  } = useTeamManagement();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Profissionais</h1>
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
          if (!open) setEditingMember(null);
        }}
        editingMember={editingMember}
        onSuccess={handleSuccess}
        title={editingMember ? 'Editar Profissional' : 'Adicionar Novo Profissional'}
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

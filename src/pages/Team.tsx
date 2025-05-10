
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamList from '@/components/Team/TeamList';
import TeamMemberDialog from '@/components/Team/TeamMemberDialog';
import DeleteConfirmDialog from '@/components/Team/DeleteConfirmDialog';

const Team = () => {
  const { currentUser } = useAuth();
  
  const {
    teamMembers,
    isLoading,
    selectedMember,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleAddMember,
    handleEditMember,
    handleDeleteClick,
    handleCreateOrUpdate,
    handleConfirmDelete,
  } = useTeamMembers();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Equipe</h1>
          
          {currentUser?.isManager && (
            <Button 
              onClick={handleAddMember}
              className="bg-salon-purple hover:bg-salon-dark-purple"
            >
              <UserPlus className="mr-2" size={18} />
              Adicionar Membro
            </Button>
          )}
        </div>
        
        <TeamList 
          members={teamMembers} 
          onEdit={handleEditMember} 
          onDelete={handleDeleteClick} 
          isLoading={isLoading}
          currentUserId={currentUser?.id}
        />
      </div>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedMember={selectedMember}
        onSubmit={handleCreateOrUpdate}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        memberName={selectedMember?.name}
        isLoading={isLoading}
      />
    </MainLayout>
  );
};

export default Team;


import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember } from '@/types';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamHeader from '@/components/Team/TeamHeader';
import SearchBar from '@/components/Team/SearchBar';
import TeamMembersList from '@/components/Team/TeamMembersList';
import TeamMemberDialog from '@/components/Team/TeamMemberDialog';
import DeleteConfirmDialog from '@/components/Team/DeleteConfirmDialog';

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

  const handleEdit = (memberId: string) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  };

  const handleDelete = (memberId: string) => {
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
    return currentUser?.isManager || memberId === currentUser?.id;
  };

  const canDeleteMember = (memberId: string): boolean => {
    return currentUser?.isManager && memberId !== currentUser?.id;
  };

  // Find the currently editing member object
  const selectedMember = editingMember 
    ? teamMembers.find(m => m.id === editingMember) || null 
    : null;

  // Get the name of the member to be deleted
  const memberToDeleteName = memberToDelete
    ? teamMembers.find(m => m.id === memberToDelete)?.name
    : undefined;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <TeamHeader 
            onAddNewMember={() => setEditingMember(null)} 
            canAddMembers={!!currentUser?.isManager} 
          />
          
          <TeamMemberDialog 
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            selectedMember={selectedMember}
            onSubmit={handleMemberSave}
            isLoading={isLoading}
          />
        </Dialog>

        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <TeamMembersList 
          members={teamMembers}
          isLoading={isLoading}
          searchTerm={searchTerm}
          currentUserId={currentUser?.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEditMember={canEditMember}
          canDeleteMember={canDeleteMember}
        />
      </div>

      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleMemberDelete}
        memberName={memberToDeleteName}
        isLoading={isLoading}
      />
    </MainLayout>
  );
};

export default Team;

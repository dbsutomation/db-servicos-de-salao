
import { useState } from 'react';
import { TeamMember } from '@/types';

export const useTeamDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleEdit = (memberId: string) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  };

  const confirmDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  };

  return {
    dialogOpen,
    setDialogOpen,
    editingMember,
    setEditingMember,
    deleteDialogOpen,
    setDeleteDialogOpen,
    memberToDelete,
    setMemberToDelete,
    handleEdit,
    confirmDeleteMember
  };
};

export default useTeamDialog;

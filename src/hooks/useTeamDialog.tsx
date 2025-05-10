
import { useState, useCallback } from 'react';

export const useTeamDialog = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Use useCallback to prevent handleEdit and confirmDeleteMember from causing re-renders
  const handleEdit = useCallback((memberId: string) => {
    setEditingMember(memberId);
    setDialogOpen(true);
  }, []);

  const confirmDeleteMember = useCallback((memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteDialogOpen(true);
  }, []);

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

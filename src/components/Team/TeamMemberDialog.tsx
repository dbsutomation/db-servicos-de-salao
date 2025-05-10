
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TeamMemberForm from '@/components/Forms/TeamMember';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMember: string | null;
  onSuccess: (data: any) => void;
  title: string;
}

const TeamMemberDialog = ({
  open,
  onOpenChange,
  editingMember,
  onSuccess,
  title
}: TeamMemberDialogProps) => {
  console.log("TeamMemberDialog - editingMember:", editingMember);
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Small delay to ensure the form is reset after the dialog animation completes
          setTimeout(() => onOpenChange(false), 10);
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {editingMember ? 'Edite as informações do membro da equipe.' : 'Adicione um novo membro à equipe.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TeamMemberForm 
            onSuccess={onSuccess} 
            teamMemberId={editingMember} 
            key={editingMember || 'new'} // This ensures the form rerenders when editingMember changes
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDialog;

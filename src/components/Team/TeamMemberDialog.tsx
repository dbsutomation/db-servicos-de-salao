
import React from 'react';
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
  // Remove excessive logging that's causing console spam
  
  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // When closing dialog, also reset form state
          onOpenChange(false);
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
        {/* Only render form when dialog is open to avoid unnecessary renders */}
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


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
  console.log("TeamMemberDialog - editingMember:", editingMember);
  const isEditing = !!editingMember;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite as informações do membro da equipe.' : 'Adicione um novo membro à equipe.'}
          </DialogDescription>
        </DialogHeader>
        <TeamMemberForm onSuccess={onSuccess} teamMemberId={editingMember} />
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDialog;

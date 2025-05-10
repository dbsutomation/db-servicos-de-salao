
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <TeamMemberForm onSuccess={onSuccess} teamMemberId={editingMember} />
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDialog;

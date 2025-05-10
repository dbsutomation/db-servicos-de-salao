
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TeamMember } from '@/types';
import TeamMemberForm from './TeamMemberForm';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: TeamMember | null;
  onSubmit: (data: TeamMember) => void;
  isLoading: boolean;
}

const TeamMemberDialog = ({
  open,
  onOpenChange,
  selectedMember,
  onSubmit,
  isLoading
}: TeamMemberDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedMember?.id ? 'Editar Membro da Equipe' : 'Adicionar Novo Membro'}
          </DialogTitle>
        </DialogHeader>
        <TeamMemberForm 
          member={selectedMember} 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default TeamMemberDialog;

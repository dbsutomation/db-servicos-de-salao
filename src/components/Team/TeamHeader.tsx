
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';

interface TeamHeaderProps {
  onAddNewMember: () => void;
  canAddMembers: boolean;
}

const TeamHeader = ({ onAddNewMember, canAddMembers }: TeamHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold">Equipe</h1>
      
      {canAddMembers && (
        <DialogTrigger asChild>
          <Button 
            className="bg-salon-purple hover:bg-salon-dark-purple shadow-md"
            onClick={onAddNewMember}
          >
            <Plus className="mr-2" size={18} />
            Novo Membro
          </Button>
        </DialogTrigger>
      )}
    </div>
  );
};

export default TeamHeader;


import React from 'react';
import { TeamMember } from '@/types';
import MemberCard from './MemberCard';

interface TeamMembersListProps {
  members: TeamMember[];
  isLoading: boolean;
  searchTerm: string;
  currentUserId?: string;
  onEdit: (memberId: string) => void;
  onDelete: (memberId: string) => void;
  canEditMember: (memberId: string) => boolean;
  canDeleteMember: (memberId: string) => boolean;
}

const TeamMembersList = ({
  members,
  isLoading,
  searchTerm,
  currentUserId,
  onEdit,
  onDelete,
  canEditMember,
  canDeleteMember
}: TeamMembersListProps) => {
  // Filter team members based on search term
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.profession && member.profession.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Carregando membros da equipe...</p>
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg shadow-md border-2 border-gray-100">
        {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEditMember(member.id)}
          canDelete={canDeleteMember(member.id)}
        />
      ))}
    </div>
  );
};

export default TeamMembersList;

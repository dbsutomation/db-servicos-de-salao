
import React from 'react';
import { TeamMember } from '@/types';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MemberCardProps {
  member: TeamMember;
  currentUserId?: string;
  onEdit: (memberId: string) => void;
  onDelete: (memberId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const MemberCard = ({ 
  member, 
  currentUserId, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: MemberCardProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 ${member.id === currentUserId ? 'border-salon-purple/30' : 'border-gray-100'} overflow-hidden flex flex-col`}
    >
      <div className="p-6 flex items-start gap-4">
        <Avatar className="h-16 w-16 bg-salon-purple/20">
          <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
            {member.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-lg">{member.name}</h3>
            {member.id === currentUserId && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                Você
              </span>
            )}
            {member.isManager && (
              <span className="text-xs bg-salon-purple/20 text-salon-purple px-2 py-0.5 rounded">
                Gerente
              </span>
            )}
          </div>
          
          <div className="mt-2 space-y-1 text-sm">
            {member.profession && (
              <p><span className="font-medium">Profissão:</span> {member.profession}</p>
            )}
            {member.phone && (
              <p><span className="font-medium">Telefone:</span> {member.phone}</p>
            )}
            <p><span className="font-medium">Email:</span> {member.email}</p>
            <p>
              <span className="font-medium">Status:</span>
              {' '}
              {member.hasAccess ? (
                <span className="text-green-600">Ativo</span>
              ) : (
                <span className="text-red-600">Inativo</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member.id)}
              className="h-8 w-8"
            >
              <Edit size={16} />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(member.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCard;

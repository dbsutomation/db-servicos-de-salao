
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { TeamMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface TeamListProps {
  teamMembersList: TeamMember[];
  onEdit: (memberId: string) => void;
  onDelete: (memberId: string) => void;
  loading: boolean;
}

const serviceCategories = [
  { value: 'Cabelo', label: 'Cabelo' },
  { value: 'Depilação', label: 'Depilação' },
  { value: 'Podologia', label: 'Podologia' },
  { value: 'Sobrancelhas', label: 'Sobrancelhas' },
  { value: 'Unhas', label: 'Unhas' }
];

const TeamList = ({ teamMembersList, onEdit, onDelete, loading }: TeamListProps) => {
  const { currentUser } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Carregando profissionais...</p>
      </div>
    );
  }
  
  if (teamMembersList.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500">
        Nenhum profissional cadastrado
      </div>
    );
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = serviceCategories.find(cat => cat.value === categoryValue);
    return category?.label || categoryValue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamMembersList.map((member) => (
        <div
          key={member.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col"
        >
          <div className="p-6 flex items-start gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-lg truncate">{member.name}</h3>
              <p className="text-gray-500 truncate">{member.profession}</p>
              
              <div className="mt-2 space-y-1 text-sm">
                <p className="truncate"><span className="font-medium">Email:</span> {member.email}</p>
                <p className="truncate"><span className="font-medium">Telefone:</span> {member.phone}</p>
              </div>

              {/* Categorias de serviços */}
              {member.categories && member.categories.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Categorias:</p>
                  <div className="flex gap-1 flex-wrap">
                    {member.categories.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {getCategoryLabel(category)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-3 flex gap-2 flex-wrap">
                {member.hasAccess && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Acesso ao Sistema
                  </span>
                )}
                
                {member.isManager && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Gerente
                  </span>
                )}
              </div>
            </div>
            
            {currentUser?.isManager && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(member.id)}
                  className="h-8 w-8"
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(member.id)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;

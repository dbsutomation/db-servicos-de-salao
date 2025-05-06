
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfileProps {
  name: string;
  isManager: boolean;
}

const UserProfile = ({ name, isManager }: UserProfileProps) => {
  return (
    <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-2 border border-gray-200">
          <AvatarFallback className="bg-salon-purple/20 text-salon-purple">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-gray-500">
            {isManager ? 'Gerente' : 'Profissional'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

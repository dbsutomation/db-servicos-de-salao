
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserProfileProps {
  name: string;
  isManager: boolean;
}

const UserProfile = ({ name, isManager }: UserProfileProps) => {
  return (
    <div className="border-t-2 border-border p-4 bg-background">
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-2 border border-border">
          <AvatarFallback className="bg-primary/20 text-primary">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {isManager ? 'Gerente' : 'Profissional'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;


import React from 'react';
import { TeamMember } from '@/types';
import { User, Edit, Trash2, Check, X, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from "@/components/ui/badge";

interface TeamListProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  isLoading: boolean;
  currentUserId?: string;
  canEditMember: (memberId: string) => boolean;
  canDeleteMember: (memberId: string) => boolean;
}

const TeamList = ({ 
  members, 
  onEdit, 
  onDelete, 
  isLoading, 
  currentUserId,
  canEditMember,
  canDeleteMember 
}: TeamListProps) => {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p>Carregando membros da equipe...</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>Nenhum membro encontrado na equipe.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Profissão</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gerente</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id} className={member.id === currentUserId ? 'bg-gray-50' : ''}>
              <TableCell className="font-medium flex items-center gap-2">
                <User className="text-gray-500" size={16} />
                <div>
                  {member.name}
                  {member.id === currentUserId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Você
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.profession || "-"}</TableCell>
              <TableCell>{member.phone || "-"}</TableCell>
              <TableCell>
                {member.hasAccess ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check size={16} /> Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <X size={16} /> Inativo
                  </span>
                )}
              </TableCell>
              <TableCell>
                {member.isManager ? (
                  <span className="flex items-center gap-1 text-purple-600">
                    <UserCheck size={16} /> Sim
                  </span>
                ) : (
                  <span>Não</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(member)}
                    disabled={!canEditMember(member.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDelete(member)}
                    disabled={!canDeleteMember(member.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamList;

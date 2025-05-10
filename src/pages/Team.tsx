
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import useTeamMembers from '@/hooks/useTeamMembers';
import TeamList from '@/components/Team/TeamList';
import TeamMemberDialog from '@/components/Team/TeamMemberDialog';
import DeleteConfirmDialog from '@/components/Team/DeleteConfirmDialog';

const Team = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const {
    teamMembers,
    isLoading,
    selectedMember,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleAddMember,
    handleEditMember,
    handleDeleteClick,
    handleCreateOrUpdate,
    handleConfirmDelete,
    canEditMember,
    canDeleteMember,
  } = useTeamMembers();

  // Filter team members based on search query
  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.profession?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Equipe</h1>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar membros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {currentUser?.isManager && (
              <Button 
                onClick={handleAddMember}
                className="bg-salon-purple hover:bg-salon-dark-purple"
              >
                <UserPlus className="mr-2" size={18} />
                Adicionar Membro
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamList 
              members={filteredTeamMembers} 
              onEdit={handleEditMember} 
              onDelete={handleDeleteClick} 
              isLoading={isLoading}
              currentUserId={currentUser?.id}
              canEditMember={canEditMember}
              canDeleteMember={canDeleteMember}
            />
          </CardContent>
        </Card>
      </div>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedMember={selectedMember}
        onSubmit={handleCreateOrUpdate}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        memberName={selectedMember?.name}
        isLoading={isLoading}
      />
    </MainLayout>
  );
};

export default Team;

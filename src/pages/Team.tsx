
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { teamMembers } from '@/data/mockData';
import TeamMemberForm from '@/components/Forms/TeamMemberForm';
import { Search } from 'lucide-react';

const Team = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredTeamMembers = teamMembers.filter((member) => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Equipe</h1>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-salon-purple hover:bg-salon-dark-purple">
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Profissional</DialogTitle>
              </DialogHeader>
              <TeamMemberForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Buscar por nome ou profissão" 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="py-3 px-4 text-left">Nome</th>
                <th className="py-3 px-4 text-left">Profissão</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTeamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/50">
                  <td className="py-3 px-4">{member.name}</td>
                  <td className="py-3 px-4">{member.profession}</td>
                </tr>
              ))}
              {filteredTeamMembers.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-gray-500">
                    {searchTerm ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;

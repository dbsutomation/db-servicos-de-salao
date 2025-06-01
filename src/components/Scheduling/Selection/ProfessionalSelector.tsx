
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMember } from '@/types';

interface ProfessionalSelectorProps {
  professionals: TeamMember[];
  selectedProfessional: string;
  onProfessionalChange: (value: string) => void;
}

export const ProfessionalSelector = ({ 
  professionals, 
  selectedProfessional, 
  onProfessionalChange 
}: ProfessionalSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seleção do Profissional</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedProfessional} onValueChange={onProfessionalChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um profissional" />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.name} - {professional.profession}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

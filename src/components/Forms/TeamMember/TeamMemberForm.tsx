
import React from 'react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import useTeamMemberForm from './useTeamMemberForm';
import BasicInfoFields from './BasicInfoFields';
import AccountFields from './AccountFields';
import PermissionFields from './PermissionFields';
import { TeamMemberFormValues } from './validationSchema';

interface TeamMemberFormProps {
  onSuccess: (data: TeamMemberFormValues) => void;
  teamMemberId?: string | null;
}

const TeamMemberForm = ({ onSuccess, teamMemberId }: TeamMemberFormProps) => {
  const { form, isEditing, handleSubmit } = useTeamMemberForm({ 
    teamMemberId, 
    onSuccess 
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoFields form={form} />
        <AccountFields form={form} isEditing={isEditing} />
        <PermissionFields form={form} />
        
        <div className="flex justify-end space-x-2">
          <Button type="submit">{teamMemberId ? 'Salvar' : 'Adicionar'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default TeamMemberForm;

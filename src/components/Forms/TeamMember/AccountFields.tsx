import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { TeamMemberFormValues } from './validationSchema';
import { ShieldAlert } from 'lucide-react';
import { DEFAULT_PASSWORD } from '@/services/teamService';

interface AccountFieldsProps {
  form: UseFormReturn<TeamMemberFormValues>;
  isEditing: boolean;
}

const AccountFields = ({ form, isEditing }: AccountFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="exemplo@email.com" disabled={isEditing} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isEditing && (
        <div className="space-y-2">
          <div className="space-y-1">
            <FormLabel>Senha padrão de primeiro acesso</FormLabel>
            <Input
              type="text"
              value={DEFAULT_PASSWORD}
              readOnly
              className="bg-muted font-mono text-muted-foreground cursor-default select-all"
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <p>
              Informe esta senha ao profissional. No <strong>primeiro acesso</strong>, o sistema exigirá a criação de uma senha pessoal.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountFields;

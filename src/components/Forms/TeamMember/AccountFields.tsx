import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { TeamMemberFormValues } from './validationSchema';
import { Info } from 'lucide-react';
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
            <FormLabel>Senha padrão de acesso</FormLabel>
            <Input
              type="text"
              value={DEFAULT_PASSWORD}
              readOnly
              className="bg-muted font-mono text-muted-foreground cursor-default select-all"
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p><strong>Instrua o profissional a:</strong></p>
              <ol className="list-decimal list-inside space-y-0.5 text-xs">
                <li>Fazer login com o email e a senha padrão acima</li>
                <li>Na tela de login, clicar em <strong>"Esqueci minha senha"</strong></li>
                <li>Verificar o email e definir uma senha pessoal</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountFields;

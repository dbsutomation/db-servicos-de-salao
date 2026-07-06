import { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { TeamMemberFormValues } from './validationSchema';
import { Eye, EyeOff, Mail } from 'lucide-react';

interface AccountFieldsProps {
  form: UseFormReturn<TeamMemberFormValues>;
  isEditing: boolean;
}

const AccountFields = ({ form, isEditing }: AccountFieldsProps) => {
  const [showPass, setShowPass] = useState(false);

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
        <>
          {/* Aviso sobre convite por email */}
          <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <Mail size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Acesso via email</p>
              <p className="text-xs mt-0.5">
                Um email será enviado ao profissional para que ele defina sua própria senha no primeiro acesso.
                Deixe o campo senha em branco para usar este fluxo, ou defina uma senha temporária.
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha temporária (opcional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Deixe em branco para enviar convite"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>
                <FormDescription>
                  Se informada, o profissional usará esta senha no primeiro login.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
};

export default AccountFields;

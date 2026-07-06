
import * as z from 'zod';

const passwordSchema = z
  .string()
  .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
  .regex(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
  .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' })
  .regex(/[^A-Za-z0-9]/, { message: 'Senha deve conter pelo menos um caractere especial' });

export const teamMemberFormSchema = (isEditing: boolean) => z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  profession: z.string().min(2, { message: 'Profissão deve ter pelo menos 2 caracteres' }),
  phone: z.string().min(10, { message: 'Telefone deve ser válido' }),
  email: z.string().email({ message: 'Email deve ser válido' }),
  // Senha sempre opcional — ao criar, sistema envia email de convite
  // O profissional define sua senha no 1º acesso
  password: z.string().optional(),
  hasAccess: z.boolean(),
  isManager: z.boolean(),
  categories: z.array(z.string()).default([])
});

export type TeamMemberFormValues = z.infer<ReturnType<typeof teamMemberFormSchema>>;

export const PROFESSIONS = [
  'Cabelereiro',
  'Barbeiro',
  'Manicure',
  'Pedicure',
  'Esteticista',
  'Maquiador',
  'Depilador',
  'Massagista',
  'Podólogo',
  'Outro'
];

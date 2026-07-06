
import * as z from 'zod';

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


import * as z from 'zod';

// Esquema de validação adaptativo para permitir senha opcional na edição
export const teamMemberFormSchema = (isEditing: boolean) => z.object({
  name: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres'
  }),
  profession: z.string().min(2, {
    message: 'Profissão deve ter pelo menos 2 caracteres'
  }),
  phone: z.string().min(10, {
    message: 'Telefone deve ser válido'
  }),
  email: z.string().email({
    message: 'Email deve ser válido'
  }),
  password: isEditing 
    ? z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }).optional().or(z.literal(''))
    : z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  hasAccess: z.boolean(),
  isManager: z.boolean()
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


import * as z from 'zod';

// Enhanced password validation schema with more security requirements
const passwordSchema = z
  .string()
  .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
  .regex(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
  .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' })
  .regex(/[^A-Za-z0-9]/, { message: 'Senha deve conter pelo menos um caractere especial' });

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
    ? z.string().optional()
      .refine(val => val === undefined || val === '' || passwordSchema.safeParse(val).success, {
        message: 'Senha deve ter pelo menos 8 caracteres, incluir letras maiúsculas, minúsculas, números e caracteres especiais'
      })
    : passwordSchema, // Required with enhanced validation for new users
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

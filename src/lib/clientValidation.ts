import { z } from 'zod';

const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
const optionalEmail = z.string().trim().email({ message: 'Email inválido' }).or(z.literal('')).optional();
const baseSchema = z.object({
  name: z.string().trim().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: optionalEmail,
});

export const newClientSchema = baseSchema.extend({
  phone: z.string().min(1, { message: 'Telefone é obrigatório' }).regex(phoneRegex, { message: 'Telefone inválido. Use (DD) NNNNN-NNNN' }),
});
export const editClientSchema = baseSchema.extend({
  phone: z.string().optional().refine((value) => !value || phoneRegex.test(value), { message: 'Telefone inválido. Use (DD) NNNNN-NNNN' }),
});
export type ClientFormValues = z.infer<typeof editClientSchema>;
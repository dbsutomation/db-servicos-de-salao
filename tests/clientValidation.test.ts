import { describe, expect, test } from 'bun:test';
import { newClientSchema } from '../src/lib/clientValidation';

const client = { name: 'Cliente Novo', phone: '(11) 99999-1234' };
describe('Client registration', () => {
  test('allows omitted or empty email', () => {
    expect(newClientSchema.safeParse(client).success).toBe(true);
    expect(newClientSchema.safeParse({ ...client, email: '' }).success).toBe(true);
  });
  test('rejects invalid supplied email', () => {
    expect(newClientSchema.safeParse({ ...client, email: 'invalido' }).success).toBe(false);
  });
  test('still requires a phone for new clients', () => {
    expect(newClientSchema.safeParse({ ...client, phone: '' }).success).toBe(false);
  });
});
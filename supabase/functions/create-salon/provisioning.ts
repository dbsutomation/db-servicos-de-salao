export function initialAccessError(mode: unknown, password: unknown): string | null {
  if (mode !== 'password' && mode !== 'invite') return 'Escolha senha inicial ou convite por e-mail.';
  if (mode === 'password' && (typeof password !== 'string' || password.length < 8)) {
    return 'A senha inicial deve ter pelo menos 8 caracteres.';
  }
  return null;
}
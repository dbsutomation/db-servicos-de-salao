export function loginDestination(isSystemAdmin: boolean): string {
  return isSystemAdmin ? '/admin/saloes' : '/';
}

export function canEnterOperationalPages(isAuthenticated: boolean, isSystemAdmin: boolean, hasProfile: boolean): boolean {
  return isAuthenticated && !isSystemAdmin && hasProfile;
}
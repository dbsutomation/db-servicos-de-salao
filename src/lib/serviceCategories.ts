export const DEFAULT_SERVICE_CATEGORIES = ['Cabelo', 'Depilação', 'Podologia', 'Sobrancelhas', 'Unhas'];

export function getServiceCategories(values: (string | null | undefined)[]): string[] {
  return [...new Set([...DEFAULT_SERVICE_CATEGORIES, ...values].map(value => value?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
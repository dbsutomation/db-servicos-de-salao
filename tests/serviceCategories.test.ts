import { describe, it, expect } from 'bun:test';
import { getServiceCategories } from '../src/lib/serviceCategories';

describe('custom service categories', () => {
  it('accepts a custom category alongside all five existing categories', () => {
    expect(getServiceCategories(['Barba'])).toEqual(['Barba', 'Cabelo', 'Depilação', 'Podologia', 'Sobrancelhas', 'Unhas']);
  });
  it('keeps categories distinct without empty or duplicate entries', () => {
    expect(getServiceCategories([' Barba ', 'Barba', '', null]).filter(value => value === 'Barba')).toHaveLength(1);
  });
  it('uses only categories supplied by the current establishment', () => {
    expect(getServiceCategories(['Massagem'])).not.toContain('Barba');
  });
});
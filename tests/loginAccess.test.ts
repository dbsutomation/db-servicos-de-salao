import { describe, it, expect } from 'bun:test';
import { loginDestination, canEnterOperationalPages } from '../src/lib/loginAccess';

describe('shared login access', () => {
  it('sends platform administrators only to administration', () => {
    expect(loginDestination(true)).toBe('/admin/saloes');
  });
  it('sends establishment users to their dashboard', () => {
    expect(loginDestination(false)).toBe('/');
  });
  it('blocks administrators from operational pages even if they have an establishment profile', () => {
    expect(canEnterOperationalPages(true, true, true)).toBe(false);
    expect(canEnterOperationalPages(true, true, false)).toBe(false);
  });
  it('allows signed-in establishment users but not signed-out or unlinked accounts', () => {
    expect(canEnterOperationalPages(true, false, true)).toBe(true);
    expect(canEnterOperationalPages(false, false, true)).toBe(false);
    expect(canEnterOperationalPages(true, false, false)).toBe(false);
  });
});
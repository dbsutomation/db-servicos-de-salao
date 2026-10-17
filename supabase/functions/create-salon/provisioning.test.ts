import { describe, it, expect } from 'bun:test';
import { initialAccessError } from './provisioning';

describe('initial access', () => {
  it('requires eight characters for administrator-selected passwords', () => {
    expect(initialAccessError('password', '1234567')).not.toBeNull();
    expect(initialAccessError('password', '12345678')).toBeNull();
  });
  it('allows email invitations without a password', () => {
    expect(initialAccessError('invite', undefined)).toBeNull();
  });
  it('rejects an unrecognized access mode', () => {
    expect(initialAccessError('other', '12345678')).not.toBeNull();
  });
});
import { describe, expect, it } from 'vitest';
import { ScrimmageError, ValidationError } from '@scrimmage/core';
import { toUserMessage } from './errors.js';

describe('toUserMessage', () => {
  it('formats validation errors with their field details', () => {
    const message = toUserMessage(
      new ValidationError('One or more fields are invalid.', { name: ['Too short.'] }),
    );
    expect(message).toContain('One or more fields are invalid.');
    expect(message).toContain('Too short.');
  });

  it('surfaces domain error messages directly', () => {
    expect(toUserMessage(new ScrimmageError('Nope.'))).toBe('❌ Nope.');
  });

  it('hides unexpected errors behind a generic message', () => {
    expect(toUserMessage(new Error('boom'))).toBe(
      '❌ Something went wrong. Please try again later.',
    );
  });
});

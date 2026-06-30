import { ScrimmageError, ValidationError } from '@scrimmage/core';

/** Convert any thrown value into a friendly, user-facing message. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    const details = error.issues
      ? Object.values(error.issues)
          .flat()
          .map((message) => `• ${message}`)
          .join('\n')
      : '';
    return details ? `❌ ${error.message}\n${details}` : `❌ ${error.message}`;
  }

  if (error instanceof ScrimmageError) {
    return `❌ ${error.message}`;
  }

  return '❌ Something went wrong. Please try again later.';
}

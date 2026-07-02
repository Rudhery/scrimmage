import { ScrimmageError, ValidationError } from '@scrimmage/core';
import { DEFAULT_LOCALE, translate, type Locale } from '../i18n/index.js';

/**
 * Convert any thrown value into a friendly, user-facing message. Domain errors
 * carry their own (English) message; the generic fallback is localized.
 */
export function toUserMessage(error: unknown, locale: Locale = DEFAULT_LOCALE): string {
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

  return translate(locale, 'error.generic');
}

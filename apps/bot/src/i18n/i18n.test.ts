import { describe, expect, it } from 'vitest';
import { normalizeLocale, resolveLocale, translate } from './index.js';

describe('i18n', () => {
  it('translates per locale with interpolation', () => {
    expect(translate('pt-BR', 'error.guildOnly')).toBe(
      'Este comando só pode ser usado em um servidor.',
    );
    expect(translate('pt-BR', 'config.language.set', { language: 'Português' })).toContain(
      'Português',
    );
  });

  it('normalizes loose locale strings', () => {
    expect(normalizeLocale('pt-BR')).toBe('pt-BR');
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('es-ES')).toBe('es');
    expect(normalizeLocale('fr')).toBeNull();
  });

  it('resolves the guild language over the user locale, defaulting to English', () => {
    expect(resolveLocale('pt-BR', 'en-US')).toBe('pt-BR');
    expect(resolveLocale(null, 'es-ES')).toBe('es');
    expect(resolveLocale(null, null)).toBe('en');
    expect(resolveLocale('xx', 'yy')).toBe('en');
  });
});

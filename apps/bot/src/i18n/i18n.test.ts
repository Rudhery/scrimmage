import { describe, expect, it } from 'vitest';
import { localizations, normalizeLocale, resolveLocale, translate, translator } from './index.js';

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

  it('binds a translator and builds Discord command localizations', () => {
    const t = translator('pt-BR');
    expect(t('scrim.proposed')).toBe('📋 Amistoso proposto!');

    const loc = localizations('cmd.team');
    expect(loc['pt-BR']).toBe('Crie e gerencie times.');
    expect(loc['es-ES']).toBe('Crea y gestiona equipos.');
  });
});

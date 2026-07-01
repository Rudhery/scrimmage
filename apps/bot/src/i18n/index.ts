export const LOCALES = ['en', 'pt-BR', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
};

type Params = Record<string, string | number>;

// English is the source of truth; other locales may omit keys and fall back to it.
const en = {
  'error.generic': 'Something went wrong. Please try again later.',
  'error.guildOnly': 'This command can only be used in a server.',
  'error.permissionDenied': 'Only the team captain or a server manager can do that.',
  'config.notAllowed': 'You need the Manage Server permission to change settings.',
  'config.title': 'Server settings',
  'config.announceLabel': 'Announcement channel',
  'config.languageLabel': 'Language',
  'config.notSet': 'not set',
  'config.followUser': 'follows each user',
  'config.announce.set': '📢 Announcements will be posted in {channel}.',
  'config.announce.cleared':
    "📢 Announcement channel cleared — reminders fall back to the scrimmage's channel.",
  'config.language.set': '🌍 Language set to {language}.',
  'config.language.cleared': '🌍 Language now follows each user.',
  'config.pointsLabel': 'Points (W/D/L)',
  'config.adminRoleLabel': 'Scrim admin role',
  'config.reminderLabel': 'Reminder lead',
  'config.reminderDefault': 'bot default',
  'config.reminderMinutes': '{minutes} min',
  'config.points.set': '🎯 Points set to {win}/{draw}/{loss} (win/draw/loss).',
  'config.adminRole.set': '🛡️ Scrim admin role set to {role}.',
  'config.adminRole.cleared': '🛡️ Scrim admin role cleared.',
  'config.reminder.set': '⏰ Reminder lead set to {minutes} minutes.',
  'config.reminder.cleared': '⏰ Reminder lead now uses the bot default.',
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;

const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  'pt-BR': {
    'error.generic': 'Algo deu errado. Tente novamente mais tarde.',
    'error.guildOnly': 'Este comando só pode ser usado em um servidor.',
    'error.permissionDenied':
      'Apenas o capitão do time ou um administrador do servidor pode fazer isso.',
    'config.notAllowed':
      'Você precisa da permissão Gerenciar Servidor para mudar as configurações.',
    'config.title': 'Configurações do servidor',
    'config.announceLabel': 'Canal de anúncios',
    'config.languageLabel': 'Idioma',
    'config.notSet': 'não definido',
    'config.followUser': 'segue cada usuário',
    'config.announce.set': '📢 Os anúncios serão postados em {channel}.',
    'config.announce.cleared':
      '📢 Canal de anúncios removido — os lembretes voltam para o canal do amistoso.',
    'config.language.set': '🌍 Idioma definido para {language}.',
    'config.language.cleared': '🌍 O idioma agora segue cada usuário.',
  },
  es: {
    'error.generic': 'Algo salió mal. Inténtalo de nuevo más tarde.',
    'error.guildOnly': 'Este comando solo puede usarse en un servidor.',
    'error.permissionDenied':
      'Solo el capitán del equipo o un administrador del servidor puede hacer eso.',
    'config.notAllowed': 'Necesitas el permiso Gestionar servidor para cambiar la configuración.',
    'config.title': 'Configuración del servidor',
    'config.announceLabel': 'Canal de anuncios',
    'config.languageLabel': 'Idioma',
    'config.notSet': 'no establecido',
    'config.followUser': 'sigue a cada usuario',
    'config.announce.set': '📢 Los anuncios se publicarán en {channel}.',
    'config.announce.cleared':
      '📢 Canal de anuncios eliminado — los recordatorios vuelven al canal del amistoso.',
    'config.language.set': '🌍 Idioma establecido a {language}.',
    'config.language.cleared': '🌍 El idioma ahora sigue a cada usuario.',
  },
};

/** Translate a key for a locale, interpolating `{placeholders}`, falling back to English. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const template = catalogs[locale][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? `{${name}}`));
}

/** Map a Discord/loose locale string to a supported {@link Locale}, or `null`. */
export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) {
    return null;
  }
  if (input === 'pt-BR' || input.toLowerCase().startsWith('pt')) {
    return 'pt-BR';
  }
  if (input.toLowerCase().startsWith('es')) {
    return 'es';
  }
  if (input.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return null;
}

/** Resolve the effective locale: guild preference first, then the user's, then English. */
export function resolveLocale(guildLanguage: string | null, userLocale: string | null): Locale {
  return normalizeLocale(guildLanguage) ?? normalizeLocale(userLocale) ?? DEFAULT_LOCALE;
}

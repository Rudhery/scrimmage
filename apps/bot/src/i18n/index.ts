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
  'error.generic': '❌ Something went wrong. Please try again later.',
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
  'config.colorLabel': 'Brand color',
  'config.color.default': 'default',
  'config.color.set': '🎨 Brand color set to #{hex}.',
  'config.color.cleared': '🎨 Brand color reset to the default.',
  'config.color.invalid': '❌ Invalid color. Use a hex code like #5865F2.',

  'role.coach': '🎓 Coach',
  'role.assistant': '🧩 Assistant',
  'role.player': '🎮 Player',

  'team.created': '✅ Created **{name}**.',
  'team.deleted': '🗑️ Deleted **{name}**.',
  'team.renamed': '✏️ Renamed **{old}** to **{name}**.',
  'team.captainTransferred': '👑 <@{user}> is now the captain of **{name}**.',
  'team.logoSet': '🛡️ Updated the crest for **{name}**.',
  'team.logoCleared': '🛡️ Cleared the crest for **{name}**.',
  'team.roleLinked': '🎽 Linked <@&{role}> to **{name}**.',
  'team.roleUnlinked': '🎽 Unlinked the role from **{name}**.',
  'team.memberRole': '🏷️ <@{user}> is now **{role}** on **{name}**.',
  'team.memberAdded': '✅ Added <@{user}> to **{name}**.',
  'team.memberRemoved': '👋 Removed <@{user}> from **{name}**.',
  'team.modal.title': 'Create a team',
  'team.modal.name': 'Team name',
  'team.modal.tag': 'Tag (2–5 letters/numbers)',
  'team.modal.description': 'Description (optional)',
  'team.modal.logo': 'Logo / crest URL (optional)',

  'scrim.badTime':
    '❌ I could not understand that time. Use ISO 8601 (e.g. `2026-07-15T20:00`) or a Unix timestamp.',
  'scrim.proposed': '📋 Scrimmage proposed!',
  'scrim.resultRecorded': '🏁 Result recorded!',
  'scrim.confirmed': '🟢 Scrimmage confirmed!',
  'scrim.cancelled': '🔴 Scrimmage cancelled.',
  'scrim.statRecorded': '📊 Recorded **{value}** {category} for <@{user}>.',
  'scrim.btn.confirm': 'Confirm',
  'scrim.btn.cancel': 'Cancel',
  'rsvp.btn.going': 'Going',
  'rsvp.btn.maybe': 'Maybe',
  'rsvp.btn.declined': "Can't",
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;

const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  'pt-BR': {
    'error.generic': '❌ Algo deu errado. Tente novamente mais tarde.',
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
    'role.coach': '🎓 Técnico',
    'role.assistant': '🧩 Auxiliar',
    'role.player': '🎮 Jogador',
    'team.created': '✅ **{name}** criado.',
    'team.deleted': '🗑️ **{name}** excluído.',
    'team.renamed': '✏️ **{old}** renomeado para **{name}**.',
    'team.captainTransferred': '👑 <@{user}> agora é o capitão de **{name}**.',
    'team.logoSet': '🛡️ Escudo de **{name}** atualizado.',
    'team.logoCleared': '🛡️ Escudo de **{name}** removido.',
    'team.roleLinked': '🎽 <@&{role}> vinculado a **{name}**.',
    'team.roleUnlinked': '🎽 Cargo desvinculado de **{name}**.',
    'team.memberRole': '🏷️ <@{user}> agora é **{role}** em **{name}**.',
    'team.memberAdded': '✅ <@{user}> adicionado a **{name}**.',
    'team.memberRemoved': '👋 <@{user}> removido de **{name}**.',
    'team.modal.title': 'Criar um time',
    'team.modal.name': 'Nome do time',
    'team.modal.tag': 'Tag (2–5 letras/números)',
    'team.modal.description': 'Descrição (opcional)',
    'team.modal.logo': 'URL do logo / escudo (opcional)',
    'scrim.badTime':
      '❌ Não entendi esse horário. Use ISO 8601 (ex.: `2026-07-15T20:00`) ou um timestamp Unix.',
    'scrim.proposed': '📋 Amistoso proposto!',
    'scrim.resultRecorded': '🏁 Resultado registrado!',
    'scrim.confirmed': '🟢 Amistoso confirmado!',
    'scrim.cancelled': '🔴 Amistoso cancelado.',
    'scrim.statRecorded': '📊 Registrado **{value}** {category} para <@{user}>.',
    'scrim.btn.confirm': 'Confirmar',
    'scrim.btn.cancel': 'Cancelar',
    'rsvp.btn.going': 'Vou',
    'rsvp.btn.maybe': 'Talvez',
    'rsvp.btn.declined': 'Não vou',
  },
  es: {
    'error.generic': '❌ Algo salió mal. Inténtalo de nuevo más tarde.',
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
    'role.coach': '🎓 Entrenador',
    'role.assistant': '🧩 Asistente',
    'role.player': '🎮 Jugador',
    'team.created': '✅ **{name}** creado.',
    'team.deleted': '🗑️ **{name}** eliminado.',
    'team.renamed': '✏️ **{old}** renombrado a **{name}**.',
    'team.captainTransferred': '👑 <@{user}> ahora es el capitán de **{name}**.',
    'team.logoSet': '🛡️ Escudo de **{name}** actualizado.',
    'team.logoCleared': '🛡️ Escudo de **{name}** eliminado.',
    'team.roleLinked': '🎽 <@&{role}> vinculado a **{name}**.',
    'team.roleUnlinked': '🎽 Rol desvinculado de **{name}**.',
    'team.memberRole': '🏷️ <@{user}> ahora es **{role}** en **{name}**.',
    'team.memberAdded': '✅ <@{user}> añadido a **{name}**.',
    'team.memberRemoved': '👋 <@{user}> eliminado de **{name}**.',
    'team.modal.title': 'Crear un equipo',
    'team.modal.name': 'Nombre del equipo',
    'team.modal.tag': 'Tag (2–5 letras/números)',
    'team.modal.description': 'Descripción (opcional)',
    'team.modal.logo': 'URL del logo / escudo (opcional)',
    'scrim.badTime':
      '❌ No entendí esa hora. Usa ISO 8601 (p. ej. `2026-07-15T20:00`) o una marca de tiempo Unix.',
    'scrim.proposed': '📋 ¡Amistoso propuesto!',
    'scrim.resultRecorded': '🏁 ¡Resultado registrado!',
    'scrim.confirmed': '🟢 ¡Amistoso confirmado!',
    'scrim.cancelled': '🔴 Amistoso cancelado.',
    'scrim.statRecorded': '📊 Registrado **{value}** {category} para <@{user}>.',
    'scrim.btn.confirm': 'Confirmar',
    'scrim.btn.cancel': 'Cancelar',
    'rsvp.btn.going': 'Voy',
    'rsvp.btn.maybe': 'Quizás',
    'rsvp.btn.declined': 'No voy',
  },
};

/** Translate a key for a locale, interpolating `{placeholders}`, falling back to English. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const template = catalogs[locale][key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params?.[name] ?? `{${name}}`));
}

/** A translator bound to a resolved locale. */
export type Translator = (key: MessageKey, params?: Params) => string;

/** Bind a translator to a locale. */
export function translator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}

/** The English localizations map for a key, for Discord's `setXLocalizations`. */
export function localizations(key: MessageKey): Record<string, string> {
  return {
    'pt-BR': translate('pt-BR', key),
    'es-ES': translate('es', key),
  };
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

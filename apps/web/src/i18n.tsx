import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

type Params = Record<string, string | number>;

const en = {
  'nav.overview': 'Overview',
  'nav.standings': 'Standings',
  'nav.teams': 'Teams',
  'nav.scrimmages': 'Scrimmages',
  'nav.cups': 'Cups',
  'layout.server': 'server',
  'layout.testMode': '🧪 test mode',
  'layout.logout': 'Logout',

  'home.eyebrow': 'Matchday control',
  'home.tagline':
    'The live dashboard for your teams, scrimmages and standings — powered by the very same core the bot runs on.',
  'home.loading': 'Loading…',
  'home.login': 'Login with Discord →',
  'home.chooseServer': 'Choose a server',
  'home.noServers': 'You are not in any servers the bot can see yet.',
  'home.owner': 'owner',
  'home.guildIdPlaceholder': 'Enter your Discord server ID',
  'home.open': 'Open →',
  'home.testMode': '🧪 Open test mode — try every feature',

  'common.loadingApi': 'Is the API running?',
  'common.cancel': 'cancel',
  'common.close': 'close',
  'common.edit': 'edit',
  'common.remove': 'remove',
  'common.name': 'Name',
  'common.never': 'never',

  'time.justNow': 'just now',
  'time.minAgo': '{n}m ago',
  'time.hAgo': '{n}h ago',
  'time.dAgo': '{n}d ago',

  'overview.title': 'Overview',
  'overview.botOnline': 'Bot online',
  'overview.botOffline': 'Bot offline',
  'overview.lastSeen': 'Last seen {when}',
  'overview.scrimHint': '{upcoming} upcoming · {played} played',
  'overview.cupsHint': '{active} active',
  'overview.activeCups': 'Active championships',
  'overview.latestScrims': 'Latest scrimmages',
  'overview.teamActivity': 'Team activity',
  'overview.noScrims': 'No scrimmages yet',
  'overview.noTeams': 'No teams yet',
  'overview.matches': '{count} matches · last {when}',
  'overview.match': '{count} match · last {when}',
  'overview.loading': 'Loading overview…',
  'overview.error': "Couldn't load the overview",

  'standings.title': 'Standings',
  'standings.team': 'Team',
  'standings.loading': 'Loading standings…',
  'standings.error': "Couldn't load standings",
  'standings.empty': 'No matches played yet',
  'standings.emptyHint': 'The table fills up as results are recorded.',

  'teams.title': 'Teams',
  'teams.new': 'New team',
  'teams.tag': 'Tag',
  'teams.logo': 'Logo URL (optional)',
  'teams.create': 'Create team',
  'teams.creating': 'Creating…',
  'teams.loading': 'Loading teams…',
  'teams.error': "Couldn't load teams",
  'teams.empty': 'No teams yet',
  'teams.emptyHintManage': 'Create one above, or use /team create in Discord.',
  'teams.emptyHint': 'Use /team create in Discord.',
  'teams.noDescription': 'No description',
  'teams.save': 'Save changes',
  'teams.saving': 'Saving…',

  'scrims.title': 'Scrimmages',
  'scrims.filter.all': 'All',
  'scrims.schedule': 'Schedule a scrimmage',
  'scrims.home': 'Home',
  'scrims.away': 'Away',
  'scrims.selectTeam': 'Select a team…',
  'scrims.kickoff': 'Kickoff',
  'scrims.pickDateTime': 'Pick date & time',
  'scrims.scheduleBtn': 'Schedule (confirmed)',
  'scrims.scheduling': 'Scheduling…',
  'scrims.manage': 'manage',
  'scrims.recordResult': 'Record result',
  'scrims.saveScore': 'Save score',
  'scrims.mvpTitles': 'MVP titles (Discord user IDs, empty to clear)',
  'scrims.saveMvps': 'Save MVPs',
  'scrims.cancelScrim': 'Cancel scrimmage',
  'scrims.loading': 'Loading scrimmages…',
  'scrims.error': "Couldn't load scrimmages",
  'scrims.empty': 'No scrimmages here',
  'scrims.emptyHintManage': 'Schedule one above.',
  'scrims.emptyHint': 'Propose one with /scrim propose in Discord.',
  'scrims.userId': 'user id',

  'status.proposed': 'Proposed',
  'status.confirmed': 'Confirmed',
  'status.cancelled': 'Cancelled',
  'status.played': 'Played',

  'award.overall': '🏐 MVP',
  'award.offensive': '⚡ Offensive',
  'award.defensive': '🛡️ Defensive',

  'cups.title': 'Championships',
  'cups.new': 'New championship',
  'cups.format': 'Format',
  'cups.bo3': 'Best of 3',
  'cups.bo5': 'Best of 5',
  'cups.starts': 'Starts',
  'cups.ends': 'Ends',
  'cups.startDate': 'Start date',
  'cups.endDate': 'End date',
  'cups.create': 'Create championship',
  'cups.creating': 'Creating…',
  'cups.loading': 'Loading championships…',
  'cups.error': "Couldn't load championships",
  'cups.empty': 'No championships yet',
  'cups.emptyHintManage': 'Create one above.',
  'cups.emptyHint': 'A server manager can create one.',
  'cups.bestOfLine': 'best of {n}',
  'cup.status.draft': 'draft',
  'cup.status.active': 'active',
  'cup.status.completed': 'completed',

  'cupDetail.back': '← Cups',
  'cupDetail.available': 'Available teams',
  'cupDetail.noMore': 'No more teams.',
  'cupDetail.seeds': 'Seeds (top = strongest)',
  'cupDetail.seedHint': 'Click teams to add them, in seed order.',
  'cupDetail.draw': 'Draw bracket',
  'cupDetail.drawing': 'Drawing…',
  'cupDetail.notStarted': "This championship hasn't started",
  'cupDetail.notStartedHint': 'A manager will draw the bracket.',
  'cupDetail.champion': '{team} win the cup!',
  'cupDetail.loading': 'Loading championship…',
  'cupDetail.error': "Couldn't load this championship",
  'cupDetail.addSet': '+ set',
  'cupDetail.save': 'Save',
  'round.final': 'Final',
  'round.semis': 'Semifinals',
  'round.quarters': 'Quarterfinals',
  'round.n': 'Round {n}',
} satisfies Record<string, string>;

export type MessageKey = keyof typeof en;

const ptBR: Partial<Record<MessageKey, string>> = {
  'nav.overview': 'Visão geral',
  'nav.standings': 'Classificação',
  'nav.teams': 'Times',
  'nav.scrimmages': 'Amistosos',
  'nav.cups': 'Copas',
  'layout.server': 'servidor',
  'layout.testMode': '🧪 modo teste',
  'layout.logout': 'Sair',

  'home.eyebrow': 'Central de jogos',
  'home.tagline':
    'O painel ao vivo dos seus times, amistosos e classificação — movido pelo mesmo core do bot.',
  'home.loading': 'Carregando…',
  'home.login': 'Entrar com Discord →',
  'home.chooseServer': 'Escolha um servidor',
  'home.noServers': 'Você ainda não está em nenhum servidor que o bot enxerga.',
  'home.owner': 'dono',
  'home.guildIdPlaceholder': 'Digite o ID do seu servidor Discord',
  'home.open': 'Abrir →',
  'home.testMode': '🧪 Abrir modo teste — experimente tudo',

  'common.loadingApi': 'A API está rodando?',
  'common.cancel': 'cancelar',
  'common.close': 'fechar',
  'common.edit': 'editar',
  'common.remove': 'remover',
  'common.name': 'Nome',
  'common.never': 'nunca',

  'time.justNow': 'agora',
  'time.minAgo': 'há {n}m',
  'time.hAgo': 'há {n}h',
  'time.dAgo': 'há {n}d',

  'overview.title': 'Visão geral',
  'overview.botOnline': 'Bot online',
  'overview.botOffline': 'Bot offline',
  'overview.lastSeen': 'Visto {when}',
  'overview.scrimHint': '{upcoming} marcados · {played} jogados',
  'overview.cupsHint': '{active} ativos',
  'overview.activeCups': 'Campeonatos ativos',
  'overview.latestScrims': 'Últimos amistosos',
  'overview.teamActivity': 'Atividade dos times',
  'overview.noScrims': 'Nenhum amistoso ainda',
  'overview.noTeams': 'Nenhum time ainda',
  'overview.matches': '{count} partidas · último {when}',
  'overview.match': '{count} partida · último {when}',
  'overview.loading': 'Carregando visão geral…',
  'overview.error': 'Não foi possível carregar a visão geral',

  'standings.title': 'Classificação',
  'standings.team': 'Time',
  'standings.loading': 'Carregando classificação…',
  'standings.error': 'Não foi possível carregar a classificação',
  'standings.empty': 'Nenhuma partida jogada ainda',
  'standings.emptyHint': 'A tabela se preenche conforme os resultados são registrados.',

  'teams.title': 'Times',
  'teams.new': 'Novo time',
  'teams.tag': 'Tag',
  'teams.logo': 'URL do logo (opcional)',
  'teams.create': 'Criar time',
  'teams.creating': 'Criando…',
  'teams.loading': 'Carregando times…',
  'teams.error': 'Não foi possível carregar os times',
  'teams.empty': 'Nenhum time ainda',
  'teams.emptyHintManage': 'Crie um acima, ou use /team create no Discord.',
  'teams.emptyHint': 'Use /team create no Discord.',
  'teams.noDescription': 'Sem descrição',
  'teams.save': 'Salvar alterações',
  'teams.saving': 'Salvando…',

  'scrims.title': 'Amistosos',
  'scrims.filter.all': 'Todos',
  'scrims.schedule': 'Marcar um amistoso',
  'scrims.home': 'Casa',
  'scrims.away': 'Fora',
  'scrims.selectTeam': 'Selecione um time…',
  'scrims.kickoff': 'Início',
  'scrims.pickDateTime': 'Escolha data e hora',
  'scrims.scheduleBtn': 'Marcar (confirmado)',
  'scrims.scheduling': 'Marcando…',
  'scrims.manage': 'gerenciar',
  'scrims.recordResult': 'Registrar placar',
  'scrims.saveScore': 'Salvar placar',
  'scrims.mvpTitles': 'Títulos de MVP (IDs do Discord, vazio p/ limpar)',
  'scrims.saveMvps': 'Salvar MVPs',
  'scrims.cancelScrim': 'Cancelar amistoso',
  'scrims.loading': 'Carregando amistosos…',
  'scrims.error': 'Não foi possível carregar os amistosos',
  'scrims.empty': 'Nenhum amistoso aqui',
  'scrims.emptyHintManage': 'Marque um acima.',
  'scrims.emptyHint': 'Proponha com /scrim propose no Discord.',
  'scrims.userId': 'id do usuário',

  'status.proposed': 'Proposto',
  'status.confirmed': 'Confirmado',
  'status.cancelled': 'Cancelado',
  'status.played': 'Jogado',

  'award.overall': '🏐 MVP',
  'award.offensive': '⚡ Ofensivo',
  'award.defensive': '🛡️ Defensivo',

  'cups.title': 'Campeonatos',
  'cups.new': 'Novo campeonato',
  'cups.format': 'Formato',
  'cups.bo3': 'Melhor de 3',
  'cups.bo5': 'Melhor de 5',
  'cups.starts': 'Início',
  'cups.ends': 'Fim',
  'cups.startDate': 'Data de início',
  'cups.endDate': 'Data de fim',
  'cups.create': 'Criar campeonato',
  'cups.creating': 'Criando…',
  'cups.loading': 'Carregando campeonatos…',
  'cups.error': 'Não foi possível carregar os campeonatos',
  'cups.empty': 'Nenhum campeonato ainda',
  'cups.emptyHintManage': 'Crie um acima.',
  'cups.emptyHint': 'Um administrador do servidor pode criar um.',
  'cups.bestOfLine': 'melhor de {n}',
  'cup.status.draft': 'rascunho',
  'cup.status.active': 'ativo',
  'cup.status.completed': 'concluído',

  'cupDetail.back': '← Copas',
  'cupDetail.available': 'Times disponíveis',
  'cupDetail.noMore': 'Sem mais times.',
  'cupDetail.seeds': 'Semeadura (topo = mais forte)',
  'cupDetail.seedHint': 'Clique nos times para adicionar, na ordem de seed.',
  'cupDetail.draw': 'Sortear chave',
  'cupDetail.drawing': 'Sorteando…',
  'cupDetail.notStarted': 'Este campeonato ainda não começou',
  'cupDetail.notStartedHint': 'Um administrador vai sortear a chave.',
  'cupDetail.champion': '{team} vence a copa!',
  'cupDetail.loading': 'Carregando campeonato…',
  'cupDetail.error': 'Não foi possível carregar este campeonato',
  'cupDetail.addSet': '+ set',
  'cupDetail.save': 'Salvar',
  'round.final': 'Final',
  'round.semis': 'Semifinais',
  'round.quarters': 'Quartas de final',
  'round.n': 'Fase {n}',
};

const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = { en, 'pt-BR': ptBR };

export type Translate = (key: MessageKey, params?: Params) => string;

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const STORAGE_KEY = 'scrimmage.locale';

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt-BR') {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('pt')
    ? 'pt-BR'
    : 'en';
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback<Translate>(
    (key, params) => {
      const template = catalogs[locale][key] ?? en[key];
      return template.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(params?.[name] ?? `{${name}}`),
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return value;
}

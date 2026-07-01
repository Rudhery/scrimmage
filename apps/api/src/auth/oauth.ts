const DISCORD_API = 'https://discord.com/api/v10';

/** OAuth settings; present only when the API is configured for Discord login. */
export interface OAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly postLoginRedirect: string;
  readonly cookieSecure: boolean;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner?: boolean;
  permissions?: string;
}

export function buildAuthorizeUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(config: OAuthConfig, code: string): Promise<string> {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new Error(`Discord request failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

/** Exchange the OAuth code for the user's profile and guild list. */
export async function fetchIdentity(
  config: OAuthConfig,
  code: string,
): Promise<{ user: DiscordUser; guilds: DiscordGuild[] }> {
  const accessToken = await exchangeCode(config, code);
  const [user, guilds] = await Promise.all([
    fetchJson<DiscordUser>(`${DISCORD_API}/users/@me`, accessToken),
    fetchJson<DiscordGuild[]>(`${DISCORD_API}/users/@me/guilds`, accessToken),
  ]);
  return { user, guilds };
}

import { describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Team } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import { canManageTeam, requireGuildId } from './interaction.js';

function contextWithAdminRole(adminRoleId: string | null): AppContext {
  return { guildSettings: { get: async () => ({ adminRoleId }) } } as unknown as AppContext;
}

describe('requireGuildId', () => {
  it('returns the guild id inside a guild', async () => {
    const reply = vi.fn();
    const interaction = { guildId: 'g1', reply } as unknown as ChatInputCommandInteraction;
    expect(await requireGuildId(interaction)).toBe('g1');
    expect(reply).not.toHaveBeenCalled();
  });

  it('replies and returns null outside a guild', async () => {
    const reply = vi.fn();
    const interaction = { guildId: null, reply } as unknown as ChatInputCommandInteraction;
    expect(await requireGuildId(interaction)).toBeNull();
    expect(reply).toHaveBeenCalledOnce();
  });
});

describe('canManageTeam', () => {
  const team = { captainId: 'cap', guildId: 'g' } as Team;

  it('allows the captain', async () => {
    const interaction = {
      user: { id: 'cap' },
      memberPermissions: null,
    } as unknown as ChatInputCommandInteraction;
    expect(await canManageTeam(contextWithAdminRole(null), interaction, team)).toBe(true);
  });

  it('allows members with Manage Server', async () => {
    const interaction = {
      user: { id: 'other' },
      memberPermissions: { has: () => true },
    } as unknown as ChatInputCommandInteraction;
    expect(await canManageTeam(contextWithAdminRole(null), interaction, team)).toBe(true);
  });

  it('allows members holding the scrim-admin role', async () => {
    const interaction = {
      user: { id: 'other' },
      memberPermissions: { has: () => false },
      member: { roles: ['admin-role'] },
    } as unknown as ChatInputCommandInteraction;
    expect(await canManageTeam(contextWithAdminRole('admin-role'), interaction, team)).toBe(true);
  });

  it('denies everyone else', async () => {
    const interaction = {
      user: { id: 'other' },
      memberPermissions: { has: () => false },
      member: { roles: [] },
    } as unknown as ChatInputCommandInteraction;
    expect(await canManageTeam(contextWithAdminRole(null), interaction, team)).toBe(false);
  });
});

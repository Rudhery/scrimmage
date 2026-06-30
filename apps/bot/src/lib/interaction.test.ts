import { describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Team } from '@scrimmage/core';
import { canManageTeam, requireGuildId } from './interaction.js';

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
  const team = { captainId: 'cap' } as Team;

  it('allows the captain', () => {
    const interaction = {
      user: { id: 'cap' },
      memberPermissions: null,
    } as unknown as ChatInputCommandInteraction;
    expect(canManageTeam(interaction, team)).toBe(true);
  });

  it('allows members with Manage Server', () => {
    const interaction = {
      user: { id: 'other' },
      memberPermissions: { has: () => true },
    } as unknown as ChatInputCommandInteraction;
    expect(canManageTeam(interaction, team)).toBe(true);
  });

  it('denies everyone else', () => {
    const interaction = {
      user: { id: 'other' },
      memberPermissions: { has: () => false },
    } as unknown as ChatInputCommandInteraction;
    expect(canManageTeam(interaction, team)).toBe(false);
  });
});

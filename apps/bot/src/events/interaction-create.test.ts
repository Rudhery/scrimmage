import { describe, expect, it, vi } from 'vitest';
import { Collection, type Interaction } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { handleInteraction } from './interaction-create.js';

function fakeContext() {
  return { logger: { warn: vi.fn(), error: vi.fn() } } as unknown as AppContext;
}

function fakeInteraction(kind: 'chat' | 'autocomplete' | 'button', extra: object): Interaction {
  return {
    isAutocomplete: () => kind === 'autocomplete',
    isButton: () => kind === 'button',
    isChatInputCommand: () => kind === 'chat',
    ...extra,
  } as unknown as Interaction;
}

describe('handleInteraction', () => {
  it('runs the matching chat-input command', async () => {
    const execute = vi.fn();
    const command = { data: { name: 'team' }, execute } as unknown as Command;
    const commands = new Collection<string, Command>([['team', command]]);

    await handleInteraction(
      fakeInteraction('chat', { commandName: 'team' }),
      fakeContext(),
      commands,
    );

    expect(execute).toHaveBeenCalledOnce();
  });

  it('routes autocomplete to the command autocomplete handler', async () => {
    const autocomplete = vi.fn();
    const command = {
      data: { name: 'team' },
      execute: vi.fn(),
      autocomplete,
    } as unknown as Command;
    const commands = new Collection<string, Command>([['team', command]]);

    await handleInteraction(
      fakeInteraction('autocomplete', { commandName: 'team' }),
      fakeContext(),
      commands,
    );

    expect(autocomplete).toHaveBeenCalledOnce();
  });

  it('warns when the command is unknown', async () => {
    const context = fakeContext();
    await handleInteraction(
      fakeInteraction('chat', { commandName: 'ghost' }),
      context,
      new Collection<string, Command>(),
    );
    expect(context.logger.warn).toHaveBeenCalledOnce();
  });
});

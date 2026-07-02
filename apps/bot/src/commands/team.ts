import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import { TeamRole } from '@scrimmage/core';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { teamEmbed, teamListEmbed, teamStatsEmbed } from '../lib/format.js';
import { paginate, paginationRow, type PagedView } from '../lib/pagination.js';
import {
  ensureCanManageTeam,
  guildLocalize,
  localize,
  requireGuildId,
  translatorFor,
} from '../lib/interaction.js';
import { respondTeamNames } from '../lib/autocomplete.js';
import { localizations, type MessageKey, type Translator } from '../i18n/index.js';

export const teamCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Create and manage teams.')
    .setDescriptionLocalizations(localizations('cmd.team'))
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new team (opens a form — you become the captain).'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a team.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all teams in this server.'))
    .addSubcommand((sub) =>
      sub
        .setName('info')
        .setDescription("Show a team's details and roster.")
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('stats')
        .setDescription("Show a team's win/draw/loss record.")
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Rename a team.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt.setName('name').setDescription('New team name').setRequired(true).setMaxLength(50),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('captain')
        .setDescription('Transfer captaincy to another member.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addUserOption((opt) =>
          opt.setName('user').setDescription('The new captain').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('role')
        .setDescription('Set a member as coach, assistant or player.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addUserOption((opt) => opt.setName('user').setDescription('The member').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('role')
            .setDescription('Role to assign')
            .setRequired(true)
            .addChoices(
              { name: '🎓 Coach', value: TeamRole.Coach },
              { name: '🧩 Assistant', value: TeamRole.Assistant },
              { name: '🎮 Player', value: TeamRole.Player },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('logo')
        .setDescription('Set or clear the team crest/logo.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt.setName('url').setDescription('Image URL (leave empty to clear the logo)'),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('link')
        .setDescription('Link a Discord role to the team (its colours).')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addRoleOption((opt) =>
          opt.setName('role').setDescription('The team role').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('unlink')
        .setDescription('Remove the linked role from the team.')
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('member')
        .setDescription('Manage a team roster.')
        .addSubcommand((sub) =>
          sub
            .setName('add')
            .setDescription('Add a member to a team.')
            .addStringOption((opt) =>
              opt
                .setName('team')
                .setDescription('Team name')
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addUserOption((opt) =>
              opt.setName('user').setDescription('Member to add').setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('remove')
            .setDescription('Remove a member from a team.')
            .addStringOption((opt) =>
              opt
                .setName('team')
                .setDescription('Team name')
                .setRequired(true)
                .setAutocomplete(true),
            )
            .addUserOption((opt) =>
              opt.setName('user').setDescription('Member to remove').setRequired(true),
            ),
        ),
    ),

  async execute(interaction, context) {
    const guildId = await requireGuildId(interaction);
    if (!guildId) {
      return;
    }

    if (interaction.options.getSubcommandGroup(false) === 'member') {
      if (interaction.options.getSubcommand() === 'add') {
        await addMember(interaction, context, guildId);
      } else {
        await removeMember(interaction, context, guildId);
      }
      return;
    }

    switch (interaction.options.getSubcommand()) {
      case 'create':
        await interaction.showModal(
          buildCreateTeamModal(await translatorFor(context, interaction)),
        );
        return;
      case 'delete':
        await deleteTeam(interaction, context, guildId);
        return;
      case 'list':
        await listTeams(interaction, context, guildId);
        return;
      case 'info':
        await teamInfo(interaction, context, guildId);
        return;
      case 'stats':
        await teamStats(interaction, context, guildId);
        return;
      case 'rename':
        await renameTeam(interaction, context, guildId);
        return;
      case 'captain':
        await transferCaptain(interaction, context, guildId);
        return;
      case 'role':
        await setRole(interaction, context, guildId);
        return;
      case 'logo':
        await setLogo(interaction, context, guildId);
        return;
      case 'link':
        await linkRole(interaction, context, guildId);
        return;
      case 'unlink':
        await unlinkRole(interaction, context, guildId);
        return;
    }
  },

  async autocomplete(interaction, context) {
    await respondTeamNames(interaction, context);
  },
};

const CREATE_MODAL_ID = 'team:create';

/** The modal shown by `/team create`. */
function buildCreateTeamModal(t: Translator): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(CREATE_MODAL_ID)
    .setTitle(t('team.modal.title'))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel(t('team.modal.name'))
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(50)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('tag')
          .setLabel(t('team.modal.tag'))
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(5)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel(t('team.modal.description'))
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('logoUrl')
          .setLabel(t('team.modal.logo'))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(500)
          .setRequired(false),
      ),
    );
}

/** Whether a modal submission belongs to the team commands. */
export function isTeamModal(customId: string): boolean {
  return customId === CREATE_MODAL_ID;
}

/** Handle the `/team create` modal submission. */
export async function handleTeamModal(
  interaction: ModalSubmitInteraction,
  context: AppContext,
): Promise<void> {
  const { t, te, accent } = await localize(context, interaction);
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: t('error.guildOnly'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const description = interaction.fields.getTextInputValue('description').trim();
  const logoUrl = interaction.fields.getTextInputValue('logoUrl').trim();
  const team = await context.teams.createTeam({
    guildId,
    name: interaction.fields.getTextInputValue('name'),
    tag: interaction.fields.getTextInputValue('tag'),
    captainId: interaction.user.id,
    description: description.length > 0 ? description : undefined,
    logoUrl: logoUrl.length > 0 ? logoUrl : undefined,
  });

  const roster = await context.teams.getRoster(team.id);
  await interaction.reply({
    content: t('team.created', { name: team.name }),
    embeds: [teamEmbed(team, roster, te, accent)],
  });
}

async function deleteTeam(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  await context.teams.deleteTeam(guildId, team.id);
  const t = await translatorFor(context, interaction);
  await interaction.reply(t('team.deleted', { name: team.name }));
}

async function listTeams(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  await interaction.reply(await renderTeamList(context, guildId, 0));
}

/** Render one page of the team list — shared by the command and pagination buttons. */
export async function renderTeamList(
  context: AppContext,
  guildId: string,
  page: number,
): Promise<PagedView> {
  const {
    items,
    page: current,
    pageCount,
  } = paginate(await context.teams.listTeams(guildId), page);
  const row = paginationRow('page:team', current, pageCount);
  const { t, accent } = await guildLocalize(context, guildId);
  return {
    embeds: [teamListEmbed(items, current, pageCount, t, accent)],
    components: row ? [row] : [],
  };
}

async function teamInfo(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  const roster = await context.teams.getRoster(team.id);
  const { t, accent } = await guildLocalize(context, guildId);
  await interaction.reply({
    embeds: [teamEmbed(team, roster, t, accent)],
  });
}

async function teamStats(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  const standing = await context.standings.forTeam(guildId, team.id);
  const { t, accent } = await guildLocalize(context, guildId);
  await interaction.reply({
    embeds: [teamStatsEmbed(team, standing, t, accent)],
  });
}

async function renameTeam(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  const renamed = await context.teams.renameTeam(
    guildId,
    team.id,
    interaction.options.getString('name', true),
  );
  const t = await translatorFor(context, interaction);
  await interaction.reply(t('team.renamed', { old: team.name, name: renamed.name }));
}

async function transferCaptain(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  const updated = await context.teams.transferCaptain(guildId, team.id, user.id);
  const roster = await context.teams.getRoster(updated.id);
  const { t, te, accent } = await localize(context, interaction);
  await interaction.reply({
    content: t('team.captainTransferred', { user: user.id, name: updated.name }),
    embeds: [teamEmbed(updated, roster, te, accent)],
  });
}

async function setLogo(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const url = interaction.options.getString('url');
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  const updated = await context.teams.setTeamLogo(
    guildId,
    team.id,
    url && url.length > 0 ? url : null,
  );
  const roster = await context.teams.getRoster(updated.id);
  const { t, te, accent } = await localize(context, interaction);
  await interaction.reply({
    content: updated.logoUrl
      ? t('team.logoSet', { name: updated.name })
      : t('team.logoCleared', { name: updated.name }),
    embeds: [teamEmbed(updated, roster, te, accent)],
  });
}

async function linkRole(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const role = interaction.options.getRole('role', true);
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  const updated = await context.teams.setTeamRole(guildId, team.id, role.id);
  const roster = await context.teams.getRoster(updated.id);
  const { t, te, accent } = await localize(context, interaction);
  await interaction.reply({
    content: t('team.roleLinked', { role: role.id, name: updated.name }),
    embeds: [teamEmbed(updated, roster, te, accent)],
    allowedMentions: { parse: [] },
  });
}

async function unlinkRole(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  await context.teams.setTeamRole(guildId, team.id, null);
  const t = await translatorFor(context, interaction);
  await interaction.reply(t('team.roleUnlinked', { name: team.name }));
}

async function setRole(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const role = interaction.options.getString('role', true) as TeamRole;
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  await context.teams.setMemberRole(guildId, team.id, user.id, role);
  const t = await translatorFor(context, interaction);
  await interaction.reply(
    t('team.memberRole', {
      user: user.id,
      role: t(`role.${role}` as MessageKey),
      name: team.name,
    }),
  );
}

async function addMember(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  await context.teams.addMember(guildId, team.id, user.id);
  const t = await translatorFor(context, interaction);
  await interaction.reply(t('team.memberAdded', { user: user.id, name: team.name }));
}

async function removeMember(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const user = interaction.options.getUser('user', true);
  const team = await context.teams.getTeamByName(
    guildId,
    interaction.options.getString('team', true),
  );
  if (!(await ensureCanManageTeam(context, interaction, team))) {
    return;
  }
  await context.teams.removeMember(guildId, team.id, user.id);
  const t = await translatorFor(context, interaction);
  await interaction.reply(t('team.memberRemoved', { user: user.id, name: team.name }));
}

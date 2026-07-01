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
import { ROLE_LABEL, teamEmbed, teamListEmbed } from '../lib/format.js';
import { canManageTeam, requireGuildId } from '../lib/interaction.js';
import { respondTeamNames } from '../lib/autocomplete.js';
import { dmUser } from '../lib/notify.js';

const PERMISSION_DENIED = '❌ Only the team captain or a server manager can do that.';

export const teamCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Create and manage teams.')
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
        await interaction.showModal(buildCreateTeamModal());
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
    }
  },

  async autocomplete(interaction, context) {
    await respondTeamNames(interaction, context);
  },
};

const CREATE_MODAL_ID = 'team:create';

/** The modal shown by `/team create`. */
function buildCreateTeamModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(CREATE_MODAL_ID)
    .setTitle('Create a team')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('Team name')
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(50)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('tag')
          .setLabel('Tag (2–5 letters/numbers)')
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(5)
          .setRequired(true),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description (optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(false),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('logoUrl')
          .setLabel('Logo / crest URL (optional)')
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
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
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
    content: `✅ Created **${team.name}**.`,
    embeds: [teamEmbed(team, roster)],
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  await context.teams.deleteTeam(guildId, team.id);
  await interaction.reply(`🗑️ Deleted **${team.name}**.`);
}

async function listTeams(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const teams = await context.teams.listTeams(guildId);
  await interaction.reply({ embeds: [teamListEmbed(teams)] });
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
  await interaction.reply({ embeds: [teamEmbed(team, roster)] });
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  const renamed = await context.teams.renameTeam(
    guildId,
    team.id,
    interaction.options.getString('name', true),
  );
  await interaction.reply(`✏️ Renamed **${team.name}** to **${renamed.name}**.`);
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  const updated = await context.teams.transferCaptain(guildId, team.id, user.id);
  const roster = await context.teams.getRoster(updated.id);
  await interaction.reply({
    content: `👑 <@${user.id}> is now the captain of **${updated.name}**.`,
    embeds: [teamEmbed(updated, roster)],
  });
  await dmUser(
    context.client,
    user.id,
    `👑 You are now the captain of **${updated.name}**.`,
    context.logger,
  );
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  const updated = await context.teams.setTeamLogo(
    guildId,
    team.id,
    url && url.length > 0 ? url : null,
  );
  const roster = await context.teams.getRoster(updated.id);
  await interaction.reply({
    content: updated.logoUrl
      ? `🛡️ Updated the crest for **${updated.name}**.`
      : `🛡️ Cleared the crest for **${updated.name}**.`,
    embeds: [teamEmbed(updated, roster)],
  });
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  await context.teams.setMemberRole(guildId, team.id, user.id, role);
  await interaction.reply(`🏷️ <@${user.id}> is now **${ROLE_LABEL[role]}** on **${team.name}**.`);
  await dmUser(
    context.client,
    user.id,
    `🏷️ You are now **${ROLE_LABEL[role]}** on **${team.name}**.`,
    context.logger,
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  await context.teams.addMember(guildId, team.id, user.id);
  await interaction.reply(`✅ Added <@${user.id}> to **${team.name}**.`);
  await dmUser(context.client, user.id, `✅ You were added to **${team.name}**.`, context.logger);
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
  if (!canManageTeam(interaction, team)) {
    await interaction.reply({ content: PERMISSION_DENIED, flags: MessageFlags.Ephemeral });
    return;
  }
  await context.teams.removeMember(guildId, team.id, user.id);
  await interaction.reply(`👋 Removed <@${user.id}> from **${team.name}**.`);
}

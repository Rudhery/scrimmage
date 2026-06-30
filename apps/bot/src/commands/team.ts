import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { AppContext } from '../context.js';
import type { Command } from '../lib/command.js';
import { teamEmbed, teamListEmbed } from '../lib/format.js';
import { canManageTeam, requireGuildId } from '../lib/interaction.js';
import { respondTeamNames } from '../lib/autocomplete.js';

const PERMISSION_DENIED = '❌ Only the team captain or a server manager can do that.';

export const teamCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Create and manage teams.')
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a new team (you become the captain).')
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Team name').setRequired(true).setMaxLength(50),
        )
        .addStringOption((opt) =>
          opt
            .setName('tag')
            .setDescription('Short tag, e.g. RDG')
            .setRequired(true)
            .setMaxLength(5),
        ),
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
        await createTeam(interaction, context, guildId);
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
    }
  },

  async autocomplete(interaction, context) {
    await respondTeamNames(interaction, context);
  },
};

async function createTeam(
  interaction: ChatInputCommandInteraction,
  context: AppContext,
  guildId: string,
): Promise<void> {
  const team = await context.teams.createTeam({
    guildId,
    name: interaction.options.getString('name', true),
    tag: interaction.options.getString('tag', true),
    captainId: interaction.user.id,
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

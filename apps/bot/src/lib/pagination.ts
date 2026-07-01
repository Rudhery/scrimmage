import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder } from 'discord.js';

/** Items shown per page in list commands. */
export const PAGE_SIZE = 10;

export interface Page<T> {
  readonly items: T[];
  readonly page: number;
  readonly pageCount: number;
}

/** Slice `all` into the requested page, clamping the page into range. */
export function paginate<T>(all: T[], requested: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number.isFinite(requested) ? requested : 0, 0), pageCount - 1);
  const start = page * PAGE_SIZE;
  return { items: all.slice(start, start + PAGE_SIZE), page, pageCount };
}

/**
 * Build a Prev/Next row for a paginated list. The page index is encoded in each
 * button's `customId` (`<prefix>:<page>`), so paging is stateless — the handler
 * simply re-queries and re-renders. Returns `null` when there is a single page.
 */
export function paginationRow(
  prefix: string,
  page: number,
  pageCount: number,
): ActionRowBuilder<ButtonBuilder> | null {
  if (pageCount <= 1) {
    return null;
  }
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}:${page - 1}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`${prefix}:${page + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pageCount - 1),
  );
}

/** A rendered, possibly-paginated message. Works for both `reply` and `update`. */
export interface PagedView {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

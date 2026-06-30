/**
 * Parse a user-supplied kickoff time into a {@link Date}.
 *
 * Accepts an ISO 8601 string (e.g. `2026-07-15T20:00`) or a Unix timestamp in
 * seconds (e.g. `1781630400`). Returns `null` when the input cannot be parsed.
 */
export function parseSchedule(input: string): Date | null {
  const trimmed = input.trim();

  if (/^\d{9,10}$/.test(trimmed)) {
    return new Date(Number(trimmed) * 1000);
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

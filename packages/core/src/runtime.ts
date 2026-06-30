import { randomUUID } from 'node:crypto';

/** A source of the current time. Injectable so behaviour is deterministic in tests. */
export type Clock = () => Date;

/** A source of unique identifiers. Injectable so ids are stable in tests. */
export type IdGenerator = () => string;

/** Default clock backed by the system time. */
export const systemClock: Clock = () => new Date();

/** Default id generator backed by `crypto.randomUUID`. */
export const uuid: IdGenerator = () => randomUUID();

/** Common runtime dependencies shared by every service. */
export interface ServiceRuntime {
  readonly now: Clock;
  readonly generateId: IdGenerator;
}

/** Build a {@link ServiceRuntime}, falling back to system defaults. */
export function resolveRuntime(overrides?: Partial<ServiceRuntime>): ServiceRuntime {
  return {
    now: overrides?.now ?? systemClock,
    generateId: overrides?.generateId ?? uuid,
  };
}

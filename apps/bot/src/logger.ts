import { pino, type Logger } from 'pino';
import type { Config } from './config.js';

export type { Logger };

/** Create the application logger. Uses pretty output outside of production. */
export function createLogger(level: Config['logLevel']): Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  return pino({
    level,
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
        }),
  });
}

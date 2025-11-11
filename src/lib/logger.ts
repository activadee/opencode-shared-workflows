import * as core from '@actions/core';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const inActions = process.env.GITHUB_ACTIONS === 'true';

const serialize = (value?: Record<string, unknown> | string) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
};

const logToConsole = (level: LogLevel, message: string, details?: Record<string, unknown> | string) => {
  const suffix = serialize(details);
  const body = suffix ? `${message} ${suffix}` : message;

  if (inActions) {
    switch (level) {
      case 'debug':
        core.debug(body);
        return;
      case 'info':
        core.info(body);
        return;
      case 'warn':
        core.warning(body);
        return;
      case 'error':
        core.error(body);
        return;
    }
  }

  const target = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  target(`[${level.toUpperCase()}] ${body}`);
};

export const logger = {
  debug: (message: string, details?: Record<string, unknown> | string) =>
    logToConsole('debug', message, details),
  info: (message: string, details?: Record<string, unknown> | string) =>
    logToConsole('info', message, details),
  warn: (message: string, details?: Record<string, unknown> | string) =>
    logToConsole('warn', message, details),
  error: (message: string, details?: Record<string, unknown> | string) =>
    logToConsole('error', message, details),
  fatal: (error: unknown) => {
    if (error instanceof Error) {
      logToConsole('error', error.message, { stack: error.stack });
    } else {
      logToConsole('error', 'Unknown fatal error', { error });
    }
  }
};

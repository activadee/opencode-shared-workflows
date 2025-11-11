import { MissingEnvError } from './errors';

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new MissingEnvError(name);
  }

  return value;
};

export const optionalEnv = (name: string, fallback?: string): string | undefined => {
  const value = process.env[name];
  return value ?? fallback;
};

export const asBoolean = (name: string, defaultValue = false): boolean => {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

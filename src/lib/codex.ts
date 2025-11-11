import path from 'node:path';
import { runCommand } from './exec';
import { logger } from './logger';

export interface CodexRunOptions {
  args?: string[];
  input?: string;
  promptPath?: string;
  workingDirectory?: string;
  extraEnv?: Record<string, string>;
}

const decodeCodexAuth = (): string | undefined => {
  if (process.env.CODEX_AUTH_JSON) {
    return process.env.CODEX_AUTH_JSON;
  }

  const encoded = process.env.CODEX_AUTH_JSON_B64;
  if (!encoded) {
    return undefined;
  }

  return Buffer.from(encoded, 'base64').toString('utf8');
};

export class CodexClient {
  constructor(private readonly binary = 'codex') {}

  private buildEnv(extraEnv?: Record<string, string>) {
    const env: NodeJS.ProcessEnv = { ...process.env };
    const decoded = decodeCodexAuth();
    if (decoded) {
      env.CODEX_AUTH_JSON = decoded;
    }

    if (extraEnv) {
      for (const [key, value] of Object.entries(extraEnv)) {
        env[key] = value;
      }
    }

    return env;
  }

  async run({ args = [], input, promptPath, workingDirectory, extraEnv }: CodexRunOptions) {
    const finalArgs = [...args];
    if (promptPath) {
      finalArgs.push('--prompt', path.resolve(promptPath));
    }

    logger.debug('Invoking Codex CLI', { args: finalArgs });

    const { stdout } = await runCommand({
      command: this.binary,
      args: finalArgs,
      cwd: workingDirectory,
      env: this.buildEnv(extraEnv),
      input,
      silent: true
    });

    return stdout.trim();
  }
}

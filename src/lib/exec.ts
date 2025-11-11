import { execa, type Options as ExecaOptions, type Result, type ResultPromise } from 'execa';
import { logger } from './logger';

export interface ExecOptions extends ExecaOptions {
  command: string;
  args?: string[];
  silent?: boolean;
}

type NormalizedResult = Omit<Result, 'stdout' | 'stderr'> & { stdout: string; stderr: string };

const normalizeOutput = (value: Result['stdout']) => {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('utf8');
  }
  return String(value);
};

export const runCommand = async ({ command, args = [], silent, ...options }: ExecOptions): Promise<NormalizedResult> => {
  logger.debug('exec', { command, args });
  const subprocess: ResultPromise = execa(command, args, {
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'inherit',
    encoding: 'utf8',
    ...options
  });

  if (!silent) {
    subprocess.stdout?.pipe(process.stdout);
    subprocess.stderr?.pipe(process.stderr);
  }

  const result: Result = await subprocess;
  return {
    ...result,
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr)
  };
};
